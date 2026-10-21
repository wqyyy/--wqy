import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const pageFontSize = {
  postcssPlugin: "page-font-size",
  OnceExit(root) {
    root.walkDecls("font-size", (declaration) => {
      if (!/\d(?:px|rem|em|%|vw|vh)/.test(declaration.value)) return;
      if (declaration.parent.selector?.split(",").some(selector => ["html", ":root", ":host"].includes(selector.trim()))) return;
      declaration.value = `calc(${declaration.value} + var(--page-font-increase, 2px))`;
    });
  },
};

export default {
  plugins: [tailwindcss(), autoprefixer(), pageFontSize],
};
