// CSS Modules — tell TypeScript that .module.css imports are objects of strings
declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
