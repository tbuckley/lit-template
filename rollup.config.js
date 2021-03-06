import resolve from "rollup-plugin-node-resolve";
import typescript from "rollup-plugin-typescript";

export default {
    input: 'src/components/app-root.ts',
    output: {
            sourcemap: true,
            format: 'iife',
            name: 'app',
            file: 'public/bundle.js'
    },
    plugins: [
        resolve(),
        typescript({
            typescript: require("typescript"),
        }),
    ],
};