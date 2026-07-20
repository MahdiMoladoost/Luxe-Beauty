import { randomBytes, scryptSync } from "node:crypto"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()
const SUPER_ADMIN_MOBILE = "09399496078"

const permissions = [
  ["platform.access", "ورود به پنل مدیریت پلتفرم"],
  ["role.read", "مشاهده نقش‌ها"],
  ["role.manage", "ایجاد و مدیریت نقش‌ها"],
  ["permission.read", "مشاهده مجوزها"],
  ["permission.manage", "ایجاد و مدیریت مجوزها"],
  ["security.change-own-password", "تغییر رمز عبور خود"],
  ["security.manage", "مدیریت تنظیمات امنیتی"],
  ["audit.read", "مشاهده رویدادهای ممیزی"],
  ["identity.review", "بررسی احراز هویت"],
  ["identity.sensitive-read", "مشاهده کنترل‌شده داده هویتی حساس"],
  ["finance.read", "مشاهده عملیات مالی"],
  ["refund.manage", "مدیریت بازپرداخت"],
  ["ledger.read", "مشاهده دفتر کل"],
  ["content.manage", "مدیریت محتوا"],
  ["marketing.manage", "مدیریت بازاریابی و تبلیغات"],
  ["provider.panel.access", "ورود به پنل ارائه‌دهنده"],
  ["provider.manage", "مدیریت اطلاعات ارائه‌دهنده"],
  ["provider.staff.manage", "مدیریت اعضای ارائه‌دهنده"],
  ["booking.read", "مشاهده رزروها"],
  ["booking.manage", "مدیریت رزروها"],
  ["profile.manage", "مدیریت پروفایل خود"],
  ["support.manage", "مدیریت تیکت‌ها و پشتیبانی"],
]

const all = permissions.map(([key]) => key)
const roles = [
  { key: "super_admin", nameFa: "مدیر کل", permissions: all },
  { key: "support", nameFa: "پشتیبان", permissions: ["platform.access", "booking.read", "support.manage", "profile.manage", "security.change-own-password"] },
  { key: "finance_manager", nameFa: "مدیر مالی", permissions: ["platform.access", "finance.read", "refund.manage", "ledger.read", "security.change-own-password"] },
  { key: "identity_specialist", nameFa: "کارشناس احراز هویت", permissions: ["platform.access", "identity.review", "identity.sensitive-read", "security.change-own-password"] },
  { key: "content_manager", nameFa: "مدیر محتوا", permissions: ["platform.access", "content.manage", "security.change-own-password"] },
  { key: "marketing_manager", nameFa: "مدیر بازاریابی", permissions: ["platform.access", "marketing.manage", "security.change-own-password"] },
  { key: "salon_manager", nameFa: "مدیر سالن", permissions: ["provider.panel.access", "provider.manage", "provider.staff.manage", "booking.read", "booking.manage", "profile.manage", "security.change-own-password"] },
  { key: "salon_staff", nameFa: "کارمند سالن", permissions: ["provider.panel.access", "booking.read", "booking.manage", "profile.manage", "security.change-own-password"] },
  { key: "specialist", nameFa: "متخصص", permissions: ["provider.panel.access", "booking.read", "profile.manage", "security.change-own-password"] },
  { key: "customer", nameFa: "مشتری", permissions: ["profile.manage"] },
]

function passwordHash(password) {
  if (!password || password.length < 12 || !/[A-Za-z\p{L}]/u.test(password) || !/\d/.test(password)) {
    throw new Error("SEED_SUPER_ADMIN_INITIAL_PASSWORD must be 12-128 characters and include letters and digits")
  }
  const pepper = process.env.PASSWORD_PEPPER
  if (!pepper || pepper.length < 16) throw new Error("PASSWORD_PEPPER must contain at least 16 characters")

  const salt = randomBytes(16)
  const N = 16_384
  const r = 8
  const p = 1
  const derived = scryptSync(`${password}\u0000${pepper}`, salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 })
  return ["scrypt", "v1", `N=${N},r=${r},p=${p}`, salt.toString("base64url"), derived.toString("base64url")].join("$")
}

async function seedRbac() {
  for (const [key, description] of permissions) {
    await prisma.permission.upsert({
      where: { key },
      update: { description },
      create: { key, description },
    })
  }

  for (const definition of roles) {
    const role = await prisma.role.upsert({
      where: { key: definition.key },
      update: { nameFa: definition.nameFa, system: true },
      create: { key: definition.key, nameFa: definition.nameFa, system: true },
    })
    const rows = await prisma.permission.findMany({ where: { key: { in: definition.permissions } }, select: { id: true } })
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } })
    await prisma.rolePermission.createMany({ data: rows.map((permission) => ({ roleId: role.id, permissionId: permission.id })) })
  }
}

async function seedSuperAdmin() {
  const initialPassword = process.env.SEED_SUPER_ADMIN_INITIAL_PASSWORD
  if (!initialPassword) {
    console.info("RBAC seeded. Super-admin bootstrap skipped because SEED_SUPER_ADMIN_INITIAL_PASSWORD is not set.")
    return
  }

  const hash = passwordHash(initialPassword)
  const user = await prisma.user.upsert({
    where: { mobileNormalized: SUPER_ADMIN_MOBILE },
    update: { status: "ACTIVE" },
    create: { mobileNormalized: SUPER_ADMIN_MOBILE, status: "ACTIVE" },
  })
  const role = await prisma.role.findUniqueOrThrow({ where: { key: "super_admin" } })
  const assignment = await prisma.userRole.findFirst({
    where: { userId: user.id, roleId: role.id, scopeType: "PLATFORM", scopeId: null, revokedAt: null },
  })
  if (!assignment) {
    await prisma.userRole.create({ data: { userId: user.id, roleId: role.id, scopeType: "PLATFORM", scopeId: null } })
  }

  await prisma.$executeRaw`
    INSERT INTO "LoginCredential" (
      "userId", "passwordHash", "passwordAlgorithm", "mustChangePassword", "twoFactorRequired",
      "failedAttempts", "createdAt", "updatedAt"
    ) VALUES (
      ${user.id}::uuid, ${hash}, 'scrypt-v1', true, true, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT ("userId") DO UPDATE SET
      "passwordHash" = EXCLUDED."passwordHash",
      "passwordAlgorithm" = 'scrypt-v1',
      "mustChangePassword" = true,
      "twoFactorRequired" = true,
      "failedAttempts" = 0,
      "lockedUntil" = NULL,
      "updatedAt" = CURRENT_TIMESTAMP
  `

  console.info(`Super admin bootstrapped for ${SUPER_ADMIN_MOBILE}. The initial password must be changed on first login.`)
}

try {
  await seedRbac()
  await seedSuperAdmin()
} finally {
  await prisma.$disconnect()
}
