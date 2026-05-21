const fs = require("fs");

function convertToReact(svgString, componentName) {
  let content = svgString
    .replace(/xmlns=".*?"/g, "")
    .replace(/width=".*?"/, '{size}')
    .replace(/height=".*?"/, '{size}')
    .replace(/<svg\s+/, '<Svg viewBox="0 0 90 90" ')
    .replace(/<\/svg>/, '</Svg>')
    .replace(/<path\s/g, '<Path ')
    .replace(/fill-rule=/g, 'fillRule=')
    .replace(/clip-rule=/g, 'clipRule=');
    
  return `export function ${componentName}({ size = 24 }: { size?: number }) {\n  return (\n    ${content}\n  );\n}`;
}

const playSvg = fs.readFileSync("assets/images/play.svg", "utf-8");
const cpuSvg = fs.readFileSync("assets/images/cpu.svg", "utf-8");
const friendSvg = fs.readFileSync("assets/images/friend.svg", "utf-8");

const out = `import React from "react";
import Svg, { Path } from "react-native-svg";

${convertToReact(playSvg, "PawnIcon")}

${convertToReact(cpuSvg, "RobotIcon")}

${convertToReact(friendSvg, "HandshakeIcon")}
`;

fs.writeFileSync("components/ui/mode-icons.tsx", out);
console.log("Done");
