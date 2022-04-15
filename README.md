<div align="center">
<a href="https://koppajs.org" target="_blank"><img width="180" src="https://koppajs.org/images/logo-min.png" alt="Koppa.js Logo"></a>
</div>

<br>

<div align="center">
    <a href="https://npmcharts.com/compare/@koppajs/core?minimal=true" target="_blank"><img src="https://badgen.net/npm/dm/@koppajs/core?scale=1&color=69DF20" alt="Downloads"></a>
    <a href="https://www.npmjs.com/package/@koppajs/core"><img src="https://badgen.net/npm/v/@koppajs/core?scale=1&color=4AC56D" alt="Version"></a>
    <a href="http://opensource.org/licenses/MIT" target="_blank"><img src="https://badgen.net/badge/license/MIT/?scale1&color=2eaad1" alt="License"></a>
</div>

<br><br><br>

# Koppa.js, What is this?
Koppa.js is a progressive client-side rendering framework for creating user interfaces that do **not require a virtual DOM**.  
It consists of an **easy-to-use** core library that focuses on managing the individual components and the viewport.  
Koppa.js is **highly modular** and thus can be used for small SinglePages or even complex applications.

<br><br><br>

# Overview

Here is a small list what Koppa.js **Core** offers.

1. Components (single File Templates)
2. Modules (extend the functionality)
3. Router (routing content to URL)
4. Store (easy local & session Storage handling)
5. Fetcher (easy use of Fetch-API)
6. Templating HTML
7. Reactive live data

and many more...

<br><br><br>

# Ecosystem

| Project         | Status                                       | Description                       |
|-----------------|----------------------------------------------|-----------------------------------|
| [core]          | [![core-status]][core-package]               | Framework Core                    |
| [componenter]   | *in progress, coming soon*                   | Component Module                  |
| [documentation] | *in progress, coming soon*                   | Documentation                     |
| [get-started]   | [![get-started-status]][get-started]         | Git-Repository to start a project |


[core]: https://github.com/koppajs/core
[core-status]: https://badgen.net/npm/v/@koppajs/core?scale=1&color=69DF20
[core-package]: https://npmjs.com/package/@koppajs/core

[componenter]: https://github.com/koppajs/componenter

[documentation]: https://github.com/koppajs/documentation

[get-started]: https://github.com/koppajs/get-started
[get-started-status]: https://badgen.net/github/release/koppajs/get-started/?scale1&color=2eaad1

<br><br><br>

# Getting Started

## For absolute beginners
You can easy use the **koppa-core.2.0.5.min.js** in your HTML with the **script-tag**.

<br>

index.html
```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8">
    <title>Get Started with Koppa.js</title>
    <script src="https://koppajs.s3.eu-central-1.amazonaws.com/koppa-core.2.0.5.min.js"></script>
  </head>

  <body>
    <script>
      koppa.take('app-view', './app-view.html');

      koppa('app-view');
    </script>
  </body>
</html>
```

<br>

app-view.html
```html
<template>
    <header>{{title}}</header>
    <nav>Nav</nav>
    <main>Main</main>
    <footer>Footer</footer>
</template>

<script>
    data: {
        title: 'Get Started with Koppa.js'
    }
</script>

<style>
    * {
        margin: 0;
        padding: 0;
    }

    html, body {
        display: block;
        width: 100%;
        height: 100%;
    }

    app-view {
        display: block;
        width: 100%;
        height: 100%;
        background-color: #ddd;
    }
</style>
```

<br>

## For pros

### Important!
This is something you should have dealt with before.

1. [Docker](https://www.docker.com/)
2. [Node.js](https://nodejs.org/en/)
3. [Webpack](https://webpack.js.org/)

We will only teach you how to use Koppa.js, not the other things.

<br>

We have a git-repository that you can easily clone.  
This is the best and easiest way to start a full development project with **Koppa.js**.  
It provides everything you need.  

[- go to git ->](https://github.com/koppajs/get-started)

<br>

---

© 2020-present | Bastian Bensch