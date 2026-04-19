import "./lib/runtime-shield";

export function register() {
  // Runtime shield is already initialized via import side-effect
  console.log("Next.js 15 Runtime Shield: Active");
}
