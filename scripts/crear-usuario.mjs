// Crea (o reactiva) un usuario y le asigna una contraseña temporal.
// Uso:
//   npm run usuario -- correo@cliente.ec --cliente "Demo PDP" --nombre "María Pérez"
//   npm run usuario -- consultor@correo.com --admin --nombre "Consultor"

import { randomInt } from 'node:crypto';

import { adminClient } from './lib/supabase-admin.mjs';

const args = process.argv.slice(2);
const email = args.find((a) => a.includes('@'))?.toLowerCase();
const isAdmin = args.includes('--admin');
const clientArg = valueOf('--cliente');
const fullName = valueOf('--nombre') ?? email?.split('@')[0];

if (!email || (!isAdmin && !clientArg)) {
  console.error('Uso: npm run usuario -- correo@cliente.ec --cliente "Nombre del cliente" [--nombre "Nombre"]');
  console.error('     npm run usuario -- correo@consultor.com --admin [--nombre "Nombre"]');
  process.exit(1);
}

const supabase = adminClient();

let clientId = null;
if (!isAdmin) {
  const { data: clients, error } = await supabase.from('clients').select('id, name');
  if (error) fail(error);
  const match = clients.filter((c) => c.name.toLowerCase().includes(clientArg.toLowerCase()));
  if (match.length !== 1) {
    console.error(
      match.length
        ? `«${clientArg}» coincide con varios clientes: ${match.map((c) => c.name).join(', ')}`
        : `No existe un cliente parecido a «${clientArg}». Clientes: ${clients.map((c) => c.name).join(', ') || '(ninguno)'}`,
    );
    process.exit(1);
  }
  clientId = match[0].id;
}

const password = temporaryPassword();
let userId = await findUserId(email);
if (userId) {
  const { error } = await supabase.auth.admin.updateUserById(userId, { password });
  if (error) fail(error);
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) fail(error);
  userId = data.user.id;
}

const { error: profileError } = await supabase.from('profiles').upsert({
  id: userId,
  email,
  full_name: fullName,
  role: isAdmin ? 'admin' : 'client_user',
  client_id: clientId,
  active: true,
});
if (profileError) fail(profileError);

console.log('\nUsuario listo. Entrégale estos datos por un canal privado:\n');
console.log(`  Correo:      ${email}`);
console.log(`  Contraseña:  ${password}`);
console.log(`  Rol:         ${isAdmin ? 'administrador' : 'cliente'}\n`);

function valueOf(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

async function findUserId(target) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail(error);
    const user = data.users.find((u) => u.email?.toLowerCase() === target);
    if (user) return user.id;
    if (data.users.length < 200) return null;
  }
}

/** 12 caracteres sin símbolos ambiguos (0/O, 1/l). */
function temporaryPassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 12 }, () => chars[randomInt(chars.length)]).join('');
}

function fail(error) {
  console.error(`\n✗ ${error?.message ?? error}`);
  process.exit(1);
}
