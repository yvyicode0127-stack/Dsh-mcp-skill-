import { apply, name, inject } from "./index.js";

const registrations = [];
const ctx = {
  commands: {
    register: (def) => {
      registrations.push(def);
      return () => {};
    },
  },
  effect: (gen, label) => {
    const it = gen();
    let r = it.next();
    while (!r.done) r = it.next();
  },
};

apply(ctx);
console.log("name:", name);
console.log("inject:", JSON.stringify(inject));
console.log("registered commands:", registrations.map((r) => r.name));

for (const reg of registrations) {
  const noArgs = reg.handler({ rawInput: "" });
  console.log(`\n=== /${reg.name} (无参数) -> ${noArgs.kind} ===`);
  console.log(noArgs.text);

  // 用列表里的第一个名字测带参形式
  const first = /• (\S+)/.exec(noArgs.text)?.[1];
  if (first) {
    const withArg = reg.handler({ rawInput: " " + first });
    console.log(`\n=== /${reg.name} ${first} -> ${withArg.kind} ===`);
    console.log(withArg.text.slice(0, 600));
  }

  // 不存在的名字
  const bad = reg.handler({ rawInput: " no-such-thing-xyz" });
  console.log(`\n=== /${reg.name} no-such-thing-xyz -> ${bad.kind} ===`);
  console.log(bad.text);
}
