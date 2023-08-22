const map = new Map([
    ['name', 'bobby hadz'],
    ['country', 'Chile'],
]);

console.log(map);
// ✅ Convert to JSON string
const json = JSON.stringify(Object.fromEntries(map));

// 👇️ '{"name":"bobby hadz","country":"Chile"}'
console.log(json);
