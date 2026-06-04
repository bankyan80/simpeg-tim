const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, nama: true, email: true, role: true, sekolahId: true, status: true, sekolah: { select: { namaSekolah: true } } },
    orderBy: { nama: 'asc' },
  })
  users.forEach(u => console.log(u.nama, '|', u.email, '|', u.role, '|', u.status, '|', u.sekolahId || '-', '|', u.sekolah?.namaSekolah || '-'))
  console.log('\nTotal:', users.length)
}
main().then(() => prisma.$disconnect()).catch(e => console.error(e))
