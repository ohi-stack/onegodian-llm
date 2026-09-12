import fs from 'node:fs';

const failures = [];
const required = (name) => {
  const value = String(process.env[name] || '').trim();
  if (!value) failures.push(`${name} is required`);
  return value;
};

const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor < 20 || nodeMajor >= 23) failures.push(`Node ${process.version} is outside supported range >=20 <23`);
if (process.env.NODE_ENV !== 'production') failures.push('NODE_ENV must be production');

const version = required('OLLM_VERSION');
if (version && version !== '0.2.0') failures.push(`OLLM_VERSION must be 0.2.0; received ${version}`);
required('OLLM_MODEL_ID');
const backendUrl = required('OLLM_BACKEND_URL');
required('OLLM_BACKEND_MODEL');

if (backendUrl) {
  try {
    const parsed = new URL(backendUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) failures.push('OLLM_BACKEND_URL must use HTTP or HTTPS');
    if (parsed.username || parsed.password) failures.push('OLLM_BACKEND_URL must not embed credentials');
  } catch {
    failures.push('OLLM_BACKEND_URL must be a valid URL');
  }
}

if (!fs.existsSync('dist/index.js')) failures.push('required build artifact missing: dist/index.js');

if (failures.length) {
  console.error('OLLM production preflight FAILED');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'PASS',
  service: 'onegodian-llm',
  version,
  node: process.version,
  backendConfigured: true,
  buildArtifactVerified: true,
  productionClaim: false,
  note: 'Configuration/build preflight passed. Production still requires live backend, exact deployed SHA, readiness, completion provenance, and restart evidence.'
}, null, 2));
