import * as buildTools from "turbo-gulp";
import { Project } from "turbo-gulp/project";
import { LibTarget, registerLibTasks } from "turbo-gulp/targets/lib";
import { MochaTarget, registerMochaTasks } from "turbo-gulp/targets/mocha";
import { NodeTarget, registerNodeTasks } from "turbo-gulp/targets/node";

import gulp from "gulp";
import minimist, { ParsedArgs } from "minimist";

interface Options {
  devDist?: string;
}

const options: Options & ParsedArgs = minimist(process.argv.slice(2), {
  string: ["devDist"],
  default: {devDist: undefined},
  alias: {devDist: "dev-dist"},
});

const tscOptions = {
  skipLibCheck: true,
  noUnusedLocals: false,
  noUnusedParameters: false,
  typeRoots: [
    "src/custom-typings",
    "node_modules/@types",
  ],
};

const project: Project = {
  root: __dirname,
  packageJson: "package.json",
  buildDir: "build",
  distDir: "dist",
  srcDir: "src",
  tslint: {
    configuration: {
      rules: {
        "number-literal-format": false,
      },
    },
  },
  typescript: {
    tscOptions,
  },
};

const lib: LibTarget = {
  project,
  name: "lib",
  srcDir: "src/lib",
  scripts: ["**/*.ts"],
  mainModule: "index",
  dist: {
    packageJsonMap: (old: buildTools.PackageJson): buildTools.PackageJson => {
      const version: string = options.devDist !== undefined ? `${old.version}-build.${options.devDist}` : old.version;
      return <any> {...old, version, scripts: undefined, private: false};
    },
    npmPublish: {
      tag: options.devDist !== undefined ? "next" : "latest",
    },
  },
  tscOptions,
  typedoc: {
    dir: "typedoc",
    name: "Skype Http",
    deploy: {
      repository: "git@github.com:ocilo/skype-http.git",
      branch: "gh-pages",
    },
  },
  clean: {
    dirs: ["build/lib", "dist/lib"],
  },
};

const example: NodeTarget = {
  project,
  name: "example",
  srcDir: "src",
  scripts: ["example/**/*.ts", "lib/**/*.ts"],
  tsconfigJson: "src/example/tsconfig.json",
  mainModule: "example/main",
  tscOptions,
  clean: {
    dirs: ["build/example", "dist/example"],
  },
};

const test: MochaTarget = {
  project,
  name: "test",
  srcDir: "src",
  scripts: ["test/**/*.ts", "lib/**/*.ts"],
  tsconfigJson: "src/test/tsconfig.json",
  tscOptions,
  copy: [{files: ["test/test-resources/**/*"]}],
  clean: {
    dirs: ["build/test"],
  },
};

const libTasks: any = registerLibTasks(gulp, lib);
registerMochaTasks(gulp, test);
registerNodeTasks(gulp, example);
buildTools.projectTasks.registerAll(gulp, project);

gulp.task("all:tsconfig.json", gulp.parallel("lib:tsconfig.json", "test:tsconfig.json", "example:tsconfig.json"));
gulp.task("dist", libTasks.dist);
