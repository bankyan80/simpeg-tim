import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create PrismaClient with minimal logging
const prismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient

// ---------------------------------------------------------------------------
// Simple query-queue (mutex) that serialises every Prisma query so that
// SQLite never sees concurrent writes – the root cause of "database is
// locked" crashes in production Next.js.
// ---------------------------------------------------------------------------
class QueryQueue {
  private queue: Array<() => Promise<unknown>> = []
  private running = false

  /** Enqueue a DB operation; returns a promise that resolves with its result. */
  enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn()
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
      void this.process()
    })
  }

  private async process(): Promise<void> {
    if (this.running) return
    this.running = true

    while (this.queue.length > 0) {
      const next = this.queue.shift()
      if (next) {
        try {
          await next()
        } catch {
          // Error is already forwarded to the caller via reject() above.
        }
      }
    }

    this.running = false
  }
}

const queryQueue = new QueryQueue()

// ---------------------------------------------------------------------------
// Create a proxied PrismaClient that automatically routes every model method
// call through the serialising queue, while leaving non-query helpers
// ($connect, $disconnect, etc.) untouched.
// ---------------------------------------------------------------------------
function createSerializedClient(client: PrismaClient): PrismaClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver)

      // ---- Top-level $ methods -------------------------------------------------
      if (typeof prop === 'string' && prop.startsWith('$')) {
        if (typeof value === 'function') {
          // $connect / $disconnect must bypass the queue
          if (prop === '$connect' || prop === '$disconnect') {
            return value.bind(target)
          }
          // $transaction, $queryRaw, $executeRaw → queue the whole call
          return (...args: unknown[]) =>
            queryQueue.enqueue(() => value.apply(target, args))
        }
        return value
      }

      // ---- Model delegates (db.sekolah, db.pegawai, etc.) ----------------------
      if (value && typeof value === 'object') {
        return new Proxy(value, {
          get(modelTarget, modelProp, modelReceiver) {
            const modelValue = Reflect.get(modelTarget, modelProp, modelReceiver)

            if (typeof modelValue === 'function') {
              // findMany, create, update, delete, count, etc.
              return (...args: unknown[]) =>
                queryQueue.enqueue(() => modelValue.apply(modelTarget, args))
            }

            return modelValue
          },
        })
      }

      return value
    },
  }) as PrismaClient
}

// ---------------------------------------------------------------------------
// Lazy connection - do NOT auto-connect on module import.
// Let Prisma connect on first query instead.
// ---------------------------------------------------------------------------

// Export the serialised client
export const db = createSerializedClient(prismaClient)
