If you'd like to jump directly to the end and see the finished code head to [Chess Defense](https://www.chessdefense.com) directory.

# 256 - GRID BOARD

Element Layout

  Install Dependencies from package.json:
    $ npm install
  
  Build Project from polymer.json:
    $ polymer build

  Serve Project:
    $ polymer serve

  Analyze Project:
    $ polymer Analyze

  Header: 64px: <\head-navigation>
  Footer: 64px: <\foot-controls>

  Total 64: Grid:   <\four-square>
  Total 4:  Grid:   <\one-square>
            Sprite: <\square-space>

# [NODEJS](https://nodejs.org/en/)

  Node.js® is a JavaScript runtime built on Chrome's V8 JavaScript engine. Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient. Node.js' package ecosystem, npm, is the largest ecosystem of open source libraries in the world.

# [WEBCOMPONENTS 1.2.0](https://www.webcomponents.org/)

  Web components are a set of web platform APIs that allow you to create new custom, reusable, encapsulated HTML tags to use in web pages and web apps. Custom components and widgets build on the Web Component standards, will work across modern browsers, and can be used with any JavaScript library or framework that works with HTML.

  Web components are based on existing web standards. Features to support web components are currently being added to the HTML and DOM specs, letting web developers easily extend HTML with new elements with encapsulated styling and custom behavior.

  Web components are based on four main specifications:

  [Custom Elements](https://w3c.github.io/webcomponents/spec/custom/) [V1](https://hayato.io/2016/shadowdomv1/)
  [Shadow DOM](https://w3c.github.io/webcomponents/spec/shadow/)
  [JAVASCRIPT imports](https://w3c.github.io/webcomponents/spec/imports/)
  [HTML Template](https://html.spec.whatwg.org/multipage/scripting.html#the-template-element/)

# [POLYMER 3.0.0-pre.12](https://www.polymer-project.org/2.0/docs/devguide/feature-overview)

  The Polymer library provides a set of features for creating custom elements. These features are designed to make it easier and faster to make custom elements that work like standard DOM elements. Similar to standard DOM elements, Polymer elements can be:

    Instantiated using a constructor or document.createElement.
    Configured using attributes or properties.
    Populated with internal DOM inside each instance.
    Responsive to property and attribute changes.
    Styled with internal defaults or externally.
    Responsive to methods that manipulate its internal state.

  [Polymer Library](https://www.polymer-project.org/2.0/docs/devguide/feature-overview)
  [Liscense](https://github.com/Polymer/polymer/blob/master/LICENSE.txt)
  [About](https://www.polymer-project.org/about)
  [Blog](https://www.polymer-project.org/blog/)
  [Glossary](https://www.polymer-project.org/2.0/docs/glossary)
  [Rendertron](https://render-tron.appspot.com/)

  [Properties](https://www.polymer-project.org/2.0/docs/devguide/properties)
  [Observers](https://www.polymer-project.org/2.0/docs/devguide/observers)

# [POLYMER-CLI@1.7.0-pre.15]((https://github.com/Polymer/tools/tree/master/packages/cli)

  Polymer CLI is the official command line tool for Polymer projects and Web Components. It includes a build pipeline, a boilerplate generator for creating elements and apps, a linter, a development server, and a test runner.

  "entrypoint" (Defaults to index.html): The main entrypoint to your app.
  "shell" (Optional): The app shell.
  "fragments" (Optional): A list of other entrypoints into your application.
  "root" (Defaults to current working directory): The web root of your application, can be a subfolder of your project directory.
  "sources" (Defaults to src/**/*): The source files in your application.

 "builds": [

      {
        "name":                 "esm-bundled",
        "browserCapabilities":  [ "es2015", "modules" ],
        "js":                   { "minify": true },
        "css":                  { "minify": true },
        "html":                 { "minify": true },
        "bundle":               { "inlineScripts": false },
        "addServiceWorker":     true
      },

      {
        "name":                 "es6-bundled",
        "browserCapabilities":  [ "es2015" ],
        "js":                   { "minify": true, "transformModulesToAmd": true },
        "css":                  { "minify": true },
        "html":                 { "minify": true },
        "bundle":               { "inlineScripts": false },
        "addServiceWorker":     true
      },
      
      {
        "name":                 "es5-bundled",
        "js":                   { "minify": true, "compile": true, "transformModulesToAmd": true },
        "css":                  { "minify": true },
        "html":                 { "minify": true },
        "bundle":               { "inlineScripts": false },
        "addServiceWorker":     true
      }
      
    ]

# [GITHUB](https://git-scm.com/docs)

  GitHub is how people build software.
  We’re supporting a community where more than 27 million* people learn, share, and work together to build software.

  ...create a new repository on the command line
  echo "# chessDefense" >> README.md
  git init
  git add README.md
  git commit -m "first commit"
  git remote add origin https://github.com/user/project.git
  git push -u origin master

  …or push an existing repository from the command line
  git remote add origin https://github.com/user/project.git
  git push -u origin master