[stage-0 6/8] RUN --mount=type=cache,id=s/b2004163-f5a2-4020-8c11-4230a3d88e4b-/root/npm,target=/root/.npm npm ci
"npm ci" did not complete successfully: exit code: 1

View in context

npm warn config production Use `--omit=dev` instead.

npm error code EUSAGE

npm error
npm error `npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync. Please update your lock file with `npm install` before continuing.

npm error
npm error Invalid: lock file's node-fetch@2.7.0 does not satisfy node-fetch@3.3.2
npm error Invalid: lock file's node-telegram-bot-api@0.66.0 does not satisfy node-telegram-bot-api@0.64.0
npm error Missing: data-uri-to-buffer@4.0.1 from lock file

npm error Missing: fetch-blob@3.2.0 from lock file

npm error Missing: formdata-polyfill@4.0.10 from lock file

npm error Missing: node-domexception@1.0.0 from lock file

npm error Missing: web-streams-polyfill@3.3.3 from lock file

npm error
npm error Clean install a project
npm error
npm error Usage:
npm error npm ci
npm error
npm error Options:
npm error [--install-strategy <hoisted|nested|shallow|linked>] [--legacy-bundling]
npm error [--global-style] [--omit <dev|optional|peer> [--omit <dev|optional|peer> ...]]
npm error [--include <prod|dev|optional|peer> [--include <prod|dev|optional|peer> ...]]
npm error [--strict-peer-deps] [--foreground-scripts] [--ignore-scripts] [--no-audit]
npm error [--no-bin-links] [--no-fund] [--dry-run]
npm error [-w|--workspace <workspace-name> [-w|--workspace <workspace-name> ...]]
npm error [-ws|--workspaces] [--include-workspace-root] [--install-links]
npm error
npm error aliases: clean-install, ic, install-clean, isntall-clean
npm error
npm error Run "npm help ci" for more info

npm error A complete log of this run can be found in: /root/.npm/_logs/2025-08-15T05_15_47_568Z-debug-0.log
 
    
