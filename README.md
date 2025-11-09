<a name="readme-top"></a>

<img src="assets/head.png" width="100%" height="20%" />

<br>

<div align="center">
  <picture>
    <img alt="DPM Logo" src="assets/logo.png" width="200px">
  </picture>
</div>

<br>

<div align="center">
  <a href="https://github.com/bigstonedevelopment/dpm/stargazers"><img src="https://img.shields.io/github/stars/bigstonedevelopment/dpm?colorA=45464f&colorB=daaa95&style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMjU2Ij4KPHBhdGggZD0iTTIzNS4yNCw4NC4zOGwtMjguMDYsMjMuNjgsOC41NiwzNS4zOWExMy4zNCwxMy4zNCwwLDAsMS01LjA5LDEzLjkxLDEzLjU0LDEzLjU0LDAsMCwxLTE1LC42OUwxNjQsMTM5bC0zMS42NSwxOS4wNmExMy41MSwxMy41MSwwLDAsMS0xNS0uNjksMTMuMzIsMTMuMzIsMCwwLDEtNS4xLTEzLjkxbDguNTYtMzUuMzlMOTIuNzYsODQuMzhhMTMuMzksMTMuMzksMCwwLDEsNy42Ni0yMy41OGwzNi45NC0yLjkyLDE0LjIxLTMzLjY2YTEzLjUxLDEzLjUxLDAsMCwxLDI0Ljg2LDBsMTQuMjEsMzMuNjYsMzYuOTQsMi45MmExMy4zOSwxMy4zOSwwLDAsMSw3LjY2LDIzLjU4Wk04OC4xMSwxMTEuODlhOCw4LDAsMCwwLTExLjMyLDBMMTguMzQsMTcwLjM0YTgsOCwwLDAsMCwxMS4zMiwxMS4zMmw1OC40NS01OC40NUE4LDgsMCwwLDAsODguMTEsMTExLjg5Wm0tLjUsNjEuMTlMMzQuMzQsMjI2LjM0YTgsOCwwLDAsMCwxMS4zMiwxMS4zMmw1My4yNi01My4yN2E4LDgsMCwwLDAtMTEuMzEtMTEuMzFabTczLTEtNTQuMjksNTQuMjhhOCw4LDAsMCwwLDExLjMyLDExLjMybDU0LjI4LTU0LjI4YTgsOCwwLDAsMC0xMS4zMS0xMS4zMloiIHN0eWxlPSJmaWxsOiAjYmRiZGJkOyIvPgo8L3N2Zz4="></a>
  &nbsp;
  <a href="https://github.com/bigstonedevelopment/dpm/releases/latest"><img src="https://img.shields.io/github/v/release/bigstonedevelopment/dpm?colorA=45464f&colorB=daaa95&style=for-the-badge&logo=github&logoColor=bdbdbd"></a>
  &nbsp;
  <a href="https://discord.gg/MkXytNjmBt"><img src="https://img.shields.io/discord/1392135826816761918?style=for-the-badge&color=%237289DA&labelColor=45464f&logo=discord&logoColor=bdbdbd"></a>
</div>

<br>
<br>

<h2>What is DPM?</h2>
<p>Datapack Package Manager (DPM) is a command line utility which manages datapack libraries/packages.</p>

<h2>Installation</h2>
<pre lang="bash">
npm i -g @bigstonedevelopment/dpm
</pre>

<h2>Usage</h2>
<ul>
    <h3>User Commands</h3>
    <li><code>dpm install @user/repo</code> - <strong>Install package</strong></li>
    <li><code>dpm uninstall @user/repo</code> - <strong>Uninstall package</strong></li>
    <!---->
    <li><code>dpm dev</code> - <strong>Build package with hotreload</strong></li>
    <li><code>dpm build</code> - <strong>Build package</strong></li>
    <!---->
    <h3>Package Developer Commands</h3>
    <li><code>dpm package</code> - <strong>Create package</strong></li>
</ul>

<h3>Datapack Config file (Package List)</h3>
<p>For DPM to store metadata for building and which packages it needs, you need to create <code>dpm.json</code> in the same folder as /data.</p>

```json
{
  "name": "Folder Name",
  "licensePath": "./LICENSE.txt", /* This is put in /Folder Name/LICENSE.txt */

  "datapackPath": "./src",
  "buildPath": "./build",

  "dependencies": [ /* dpm install will automatically add packages to this */
    "@user/repo",
    "@user/repo/branch",
  ]
}
```

<h2>Package Developers</h2>

<h3>Config file</h3>
<p>For DPM to reconise your repo as a package you need a <code>dpm-package.json</code> file at the root ( / ) of your repo.</p>

```json
{
  "name": "Example Package",
  "description": "A example DPM package for a README!",
  "author": "BigstoneDevelopment",
  "licensePath": "./LICENSE.txt",
  
  "supportedVersions": "10-27",

  "base": "./datapack",
  "overlays": {
    "<10": "./overlays/legacy",
    "10-15": "./overlays/1.16",
    "26": "./overlays/1.21",
    ">=27": "./overlays/future"
  },

  "load": [
    "namespace:load",
  ],
  "tick": [
    "namespace:tick",
  ]
}
```

<h2>Planned Features</h2>
<ul>
  <li><input type="checkbox"> Package Version Support (Branches and Releases)</li>
  <li><input type="checkbox"> Beet and Bolt Support</li>
  <li><input type="checkbox"> TUI for manging packages</li>
  <li><input type="checkbox"> Packages requiring other packages</li>
</ul>

<h2>Contributors</h2>
<p>All contributions are welcome and if you join <a href="https://discord.bigstone.dev">our Discord</a> you can get the contributor role!</p>

<p align="right"><a href="#readme-top">(Back To Top)</a></p>

<img src="assets/foot.png" width="100%" height="40%" />
