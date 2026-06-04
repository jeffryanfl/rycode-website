/* ==================================================================
   Anatomy of a Deployment — deployment.js
   Interactive pipeline. Click a node → a single detail panel swaps
   to show that stop's content. Arrow keys move between nodes in
   the same row.

   TABLE OF CONTENTS
   -----------------
   1. CONTENT         Copy for every stop + the three file-types.
   2. RENDER          Build the detail panel DOM from a content entry.
   3. ACTIVATE        Move the gold highlight to the clicked node,
                      fade the panel, swap content, fade it back.
   4. KEYBOARD        Left/Right arrow navigation within a row.
   5. BOOT            Wire everything up on DOMContentLoaded.
   ================================================================== */


/* ------------------------------------------------------------------
   1. CONTENT
   ------------------------------------------------------------------
   Each entry is keyed by the `data-id` on its node button.
   Optional `expansion` spells out an acronym under the name.
   ------------------------------------------------------------------ */
const CONTENT = {
  "01": {
    eyebrow: "Stop 01",
    name: "Claude Code",
    tagline: "Where ideas become code.",
    bullets: [
      "Describe what you want in plain English — an AI assistant writes the code.",
      "Runs on your laptop. Can read and write files directly in your project folder.",
      "Not required for the pipeline — you could write the code by hand instead. It just speeds things up."
    ],
    note: "In practice: this entire site was built using Claude Code.",
    technical: {
      bullets: [
        "Claude Code is a CLI program that runs locally on your machine. It sends your prompt and the contents of any files it reads up to Anthropic's API, which returns instructions for what to do next.",
        "The model works in a loop: plan → call a tool (read a file, run a shell command, edit code) → see the result → decide what's next. Every step you see on screen is a distinct round-trip.",
        "By default, it only reads and writes files inside the folder you launched it from. Commands that reach outside that scope prompt you for permission first.",
        "Each session starts with a blank slate. There's no memory of previous conversations unless you explicitly tell the model what came before."
      ],
      terms: [
        { term: "CLI", def: "Command-Line Interface. A program you control by typing commands in a terminal rather than clicking in a graphical window." },
        { term: "API", def: "Application Programming Interface. A structured way one program talks to another over the network — in this case, your laptop talking to Anthropic's servers." },
        { term: "Tool call", def: "When the model decides it needs to do something concrete — read a file, run a command — it emits a structured request and waits for the result to come back." }
      ]
    }
  },

  "02": {
    eyebrow: "Stop 02",
    name: "Your Laptop",
    tagline: "Where the files actually live.",
    bullets: [
      "A website is a folder of text files — mostly just HTML, CSS, and JavaScript.",
      "You open those files with a code editor, which makes them easier to read and change.",
      "At this stage nothing is on the internet. The site only exists for you, on your own machine."
    ],
    note: "In practice: the folder for this site holds a few dozen files, total. Small enough to email as a zip.",
    technical: {
      bullets: [
        "A website is just plain text on disk. The browser does all the hard work — the \"site\" itself is a directory of files the browser knows how to read.",
        "Code editors (VS Code, Sublime, Vim) are text editors with extras: syntax coloring, autocomplete, project-wide search, built-in terminal. They don't change what's in the file — they just help you see and edit it.",
        "The three core file types — .html, .css, .js — are all plain UTF-8 text. You could open and edit them in Notepad if you wanted to.",
        "Running the site locally usually means spinning up a small web server on your own machine so the files behave the same way they will when deployed."
      ],
      terms: [
        { term: "UTF-8", def: "The standard character encoding used across the web. Represents every character in every language as a sequence of 1-4 bytes." },
        { term: "Local server", def: "A program that serves files from your disk over HTTP to your own browser, so the site behaves the same way it will in production." },
        { term: "VS Code", def: "A free code editor from Microsoft. Currently the most widely-used editor in the world." }
      ]
    }
  },

  "03": {
    eyebrow: "Stop 03",
    name: "Git",
    tagline: "Where every save becomes permanent.",
    bullets: [
      "Git is a program that takes snapshots of your folder and keeps every one of them, forever.",
      "Each snapshot is called a commit. Every commit has a short message describing what changed.",
      "Old commits never disappear. You can rewind to any previous version of the site at any time."
    ],
    note: "In practice: the commit history for this page is public — you can see every change ever made to it.",
    technical: {
      bullets: [
        "Every Git object — commit, folder snapshot, file contents — is identified by a SHA-1 hash of what's inside it. Same content, same hash, always.",
        "A commit isn't stored as a diff. It's a full snapshot pointer. Git deduplicates identical files across commits behind the scenes, so storing years of history stays cheap.",
        "The entire history lives in a hidden .git/ folder at the root of your project. Delete it and the files on disk stay — but every version before \"right now\" is gone.",
        "Branches are just lightweight pointers to commits. Switching branches rewrites the files in your folder to match whatever commit the branch is pointing at."
      ],
      terms: [
        { term: "SHA-1", def: "A hashing algorithm that turns any content into a fixed 40-character fingerprint. Git uses it as the unique ID for every commit, folder, and file it tracks." },
        { term: "HEAD", def: "Git's pointer to \"where you are right now\" in the history. Usually points at a branch, which in turn points at a commit." },
        { term: ".git/", def: "The hidden folder inside your project where Git keeps every commit, branch, setting, and object. Everything Git knows lives here." }
      ]
    }
  },

  "04": {
    eyebrow: "Stop 04",
    name: "git push",
    tagline: "The moment your work leaves your laptop.",
    bullets: [
      "A single command that uploads every commit from your laptop up to the internet.",
      "Before this point, the work only lives on your machine. After this point, a copy exists somewhere else.",
      "It's the dividing line between \"a folder on my computer\" and \"code out in the world.\""
    ],
    note: "In practice: the push that delivered this page happened somewhere between a few hours and a few days before you opened it.",
    technical: {
      bullets: [
        "`git push` uploads any commits your local repo has that the remote doesn't. If there's nothing new, nothing happens.",
        "It speaks one of two protocols: SSH (authenticated with a key pair stored on your laptop) or HTTPS (authenticated with a token). Both are encrypted end-to-end.",
        "Pushes are atomic per-branch: either every new commit lands or none of them do. There's no half-pushed state to recover from.",
        "The remote rejects pushes that would rewrite existing history unless you force-push — a safeguard against silently overwriting someone else's work."
      ],
      terms: [
        { term: "SSH", def: "Secure Shell. An encrypted protocol for talking to a remote machine. Your laptop keeps a private key; the server keeps the matching public key." },
        { term: "Token", def: "A randomly-generated string that proves you're allowed to push. Safer than sending your password with every request." },
        { term: "Force push", def: "A push that rewrites history on the remote. Powerful and dangerous — it's how you can accidentally erase someone else's commits." }
      ]
    }
  },

  "05": {
    eyebrow: "Stop 05",
    name: "GitHub",
    tagline: "The remote vault for your code.",
    bullets: [
      "A service that stores code on the internet so it can be shared and automated against.",
      "Free for public projects, used by nearly every software project you've heard of.",
      "When your push arrives, GitHub notifies anyone who's subscribed — including the service that actually puts your site online."
    ],
    note: "In practice: the repository powering this page is public. Every line of code is readable by anyone with the link.",
    technical: {
      bullets: [
        "GitHub is a hosted Git server with a web UI wrapped around it. Every push updates a remote bare repository sitting in their data center.",
        "Beyond storage, GitHub runs its own infrastructure around the repo: pull requests, issues, and Actions — automated workflows that fire on events like \"push\" or \"tag.\"",
        "When your push arrives, GitHub fires webhooks to every service subscribed to that repo — in our case, a single HTTP POST to Netlify that says \"new commit, come get it.\"",
        "GitHub is one of several Git hosts; GitLab, Bitbucket, and self-hosted Gitea are common alternatives. Git itself doesn't care which one you use."
      ],
      terms: [
        { term: "Bare repository", def: "A Git repo that holds only the .git data with no working copy alongside it. The format servers use for storage." },
        { term: "Webhook", def: "An HTTP request one server sends another the moment an event happens. Event-driven rather than poll-driven." },
        { term: "Pull request", def: "A proposal to merge commits from one branch into another, usually with discussion and review attached." }
      ]
    }
  },

  "06": {
    eyebrow: "Stop 06",
    name: "Netlify Build",
    tagline: "Where your code gets packaged for delivery.",
    bullets: [
      "The moment new code hits GitHub, Netlify pulls a fresh copy down to its own servers.",
      "For complex sites, Netlify runs a \"build\" — compiling and optimizing files before publishing.",
      "For a simple site like this one, there's not much to build. Netlify mostly just picks up the files and gets them ready to hand out."
    ],
    note: "In practice: each deploy of this site takes about 30 seconds from \"pushed\" to \"live.\"",
    technical: {
      bullets: [
        "When the GitHub webhook fires, Netlify spins up a fresh container, clones the repository, and runs whatever build command is configured (often `npm run build` for framework sites).",
        "The build's output is a folder of static files — HTML, CSS, JS, images. For a vanilla site like this one there's no build step; the files already are the output.",
        "Netlify then bundles those files, assigns the deploy a unique preview URL, and replaces the \"current\" deploy atomically — users never see a half-updated site.",
        "If the build fails, the previous deploy keeps serving. The live site doesn't go down because of a broken commit."
      ],
      terms: [
        { term: "Container", def: "An isolated, disposable mini-environment that runs one build and then gets destroyed. Keeps every build reproducible and clean." },
        { term: "Atomic deploy", def: "A deploy that flips from old to new in a single step. Users never see a partially updated site during rollout." },
        { term: "Build command", def: "The command the host runs to turn source files into deployable output. For frameworks like React or Astro, this is how HTML actually gets generated." }
      ]
    }
  },

  "07": {
    eyebrow: "Stop 07",
    name: "Netlify CDN",
    expansion: "Content Delivery Network",
    tagline: "Copies of your site, sitting all over the world.",
    bullets: [
      "A CDN is a network of servers spread across different cities — New York, Frankfurt, Tokyo, Sydney, and dozens more.",
      "The same website is copied onto all of them. When someone visits, they're served from whichever server is closest.",
      "This is why websites feel fast no matter where you're loading them from. You're talking to a copy near you, not a single \"master\" server."
    ],
    note: "In practice: the file that drew this page probably came from a server less than 500 miles from where you're sitting.",
    technical: {
      bullets: [
        "A CDN is a distributed cache. Netlify's nodes sit in dozens of cities — New York, London, Tokyo, São Paulo — and hold copies of the static files from every deploy.",
        "Incoming requests are routed to the nearest node via DNS and anycast. If that node has the file cached it serves directly; if not, it fetches once from origin and caches for next time.",
        "The latency savings are enormous: a page served from 300 miles away feels instant, while the same page served from 8,000 miles away can take full seconds to start rendering.",
        "CDNs also absorb traffic spikes. If your site suddenly gets popular, the load fans out across many nodes — the origin server barely notices."
      ],
      terms: [
        { term: "CDN", def: "Content Delivery Network. A network of cache nodes placed close to users to reduce latency and spread load." },
        { term: "Anycast", def: "A routing technique where many servers share the same IP address; the internet's routers automatically send traffic to the closest one." },
        { term: "Latency", def: "The time between asking for something and getting the first byte back. Distance matters — there's no shortcut around the speed of light." }
      ]
    }
  },

  "08": {
    eyebrow: "Stop 08",
    name: "DNS",
    expansion: "Domain Name System",
    tagline: "How browsers find your site by name.",
    bullets: [
      "Computers on the internet don't use names — they use numerical addresses called IP addresses (Internet Protocol).",
      "DNS is the phonebook. You type a name (\"rycode.dev\"); DNS returns the number.",
      "Every device caches these lookups for a while, so the phonebook isn't queried every single time you visit a site."
    ],
    note: "In practice: when you loaded this page, your computer asked DNS once and got an address back in under a tenth of a second.",
    technical: {
      bullets: [
        "DNS runs over UDP on port 53 — a lightweight, fire-and-forget network protocol. If a response doesn't come back in time, the client just asks again.",
        "Resolution walks a hierarchy: your machine asks a recursive resolver, which queries the root servers, then the TLD server for .dev, then the authoritative server that owns rycode.dev, which finally returns the IP.",
        "Every answer comes with a TTL — the number of seconds any cache is allowed to hold onto it before asking again. Shorter TTLs mean faster propagation of changes; longer TTLs mean less load on the phonebook.",
        "The record type matters: A maps a name to an IPv4 address, AAAA to IPv6, CNAME aliases one name to another, MX points to mail servers for a domain."
      ],
      terms: [
        { term: "UDP", def: "User Datagram Protocol. A minimal, no-handshake network protocol — smaller and faster than TCP, but with no built-in delivery guarantee." },
        { term: "Recursive resolver", def: "The DNS server that walks the name hierarchy on your behalf. Your ISP runs one; public ones like 1.1.1.1 and 8.8.8.8 are also available." },
        { term: "TTL", def: "Time To Live. The number of seconds a DNS answer can live in a cache before being treated as stale and looked up again." },
        { term: "Authoritative server", def: "The DNS server that owns the truth for a given domain — as opposed to a cache just repeating what it heard from someone else." }
      ]
    }
  },

  "09": {
    eyebrow: "Stop 09",
    name: "The Browser",
    tagline: "Where your work finally becomes a website.",
    bullets: [
      "The browser downloads the HTML file first, then reads it top to bottom.",
      "As it reads, it finds references to CSS and JavaScript files and downloads those too.",
      "It assembles everything into the visible page you see — text, layout, interactivity — all rendered from plain files."
    ],
    note: "In practice: the browser you're reading this in just did exactly that, moments ago.",
    technical: {
      bullets: [
        "The browser parses HTML top-to-bottom, building a tree of nodes called the DOM. When it hits a link to CSS or a script tag, it fires additional network requests in parallel.",
        "CSS gets parsed into a parallel tree — the CSSOM — which tells the browser which style rules apply to which DOM nodes. Rendering only begins once both trees are ready.",
        "JavaScript runs on a single main thread. By default a script tag pauses HTML parsing until it loads and executes, which is why performance-minded sites defer or async their scripts.",
        "Everything you see — fonts, layout, animations, interaction — is computed locally on your machine. The server just handed over the ingredients; the browser does the cooking."
      ],
      terms: [
        { term: "DOM", def: "Document Object Model. The tree of nodes the browser builds from HTML. JavaScript sees and edits the page through this tree." },
        { term: "CSSOM", def: "CSS Object Model. A parallel tree for style rules. Combined with the DOM to decide what each node looks like." },
        { term: "Main thread", def: "The single thread where JavaScript, layout, and paint all happen. Block it and the page freezes." }
      ]
    }
  },

  "html": {
    eyebrow: "In the package",
    name: "HTML",
    expansion: "HyperText Markup Language",
    tagline: "The skeleton. What's on the page.",
    bullets: [
      "The structure of every web page — headings, paragraphs, images, links, buttons.",
      "Tells the browser what's on the page, but says nothing about how it should look.",
      "Always loaded first. Nothing else can happen until the browser has the HTML."
    ],
    note: "In practice: any browser will show you this page's HTML via a \"View Source\" command, usually under the View menu.",
    technical: {
      bullets: [
        "HTML is a markup language — plain text with angle-bracketed tags that describe what each piece of content is (heading, paragraph, link, image).",
        "Tags carry semantic meaning. A nav element isn't just a box — it tells screen readers \"this is a navigation region.\" Picking the right tag is an accessibility decision, not a styling one.",
        "The browser is strict about structure but forgiving about mistakes. Missing close tags, bad nesting — it tries to recover and render something sensible.",
        "Every page starts with <!DOCTYPE html>, a declaration that tells the browser to use modern rendering rules instead of legacy \"quirks mode\" from the 1990s."
      ],
      terms: [
        { term: "Markup language", def: "A language where content is annotated with tags that describe its role. HTML and XML are markup languages; JavaScript is a programming language." },
        { term: "Semantic element", def: "An HTML tag whose name describes its purpose (header, nav, article, footer) — as opposed to generic containers like div and span." },
        { term: "DOCTYPE", def: "The declaration at the top of an HTML file that tells the browser which version of HTML to expect." }
      ]
    }
  },

  "css": {
    eyebrow: "In the package",
    name: "CSS",
    expansion: "Cascading Style Sheets",
    tagline: "The look. How everything appears.",
    bullets: [
      "The rules for what the page looks like — colors, fonts, spacing, layout.",
      "Doesn't change what's on the page. Only how it's presented.",
      "Without CSS, every website would look like a plain document from the early days of the web."
    ],
    note: "In practice: try this page in your browser's \"Reader Mode\" — it strips the CSS away and shows what HTML alone looks like.",
    technical: {
      bullets: [
        "CSS is a rule-based language. Each rule has a selector (which elements it applies to) and a block of declarations (what to change). The browser resolves every applicable rule per element.",
        "The \"cascade\" in Cascading Style Sheets is the algorithm that decides which rule wins when two rules target the same element. Specificity, source order, and !important all factor in.",
        "CSS custom properties (--gold, --radius, --spacing) are variables you define once and reuse. They can be redefined inside a scope, which makes theming and dark mode practical.",
        "Layout today runs on two main systems: Flexbox (one-dimensional, row or column) and Grid (two-dimensional, rows and columns). Both are native to the browser — no libraries required."
      ],
      terms: [
        { term: "Selector", def: "A pattern that matches elements in the DOM. For example, .nav-links a targets every link inside any element with class \"nav-links\"." },
        { term: "Specificity", def: "How \"strong\" a selector is. More-specific rules override less-specific ones, even if the less-specific rule is written later in the file." },
        { term: "Custom property", def: "A CSS variable. Declared with two dashes (--name) and referenced with var(--name)." }
      ]
    }
  },

  "js": {
    eyebrow: "In the package",
    name: "JavaScript",
    tagline: "The behavior. What happens when you interact.",
    bullets: [
      "Code that runs inside the browser, making pages react to clicks, scrolls, and typing.",
      "Every time you click a stop on this page and the detail panel swaps — that's JavaScript.",
      "Without it, the page would still be visible — but nothing would move, respond, or change."
    ],
    note: "In practice: if you disabled JavaScript in your browser settings, this page would still load — but the nodes wouldn't respond to clicks.",
    technical: {
      bullets: [
        "JavaScript runs inside a virtual machine built into every browser — V8 in Chrome and Edge, SpiderMonkey in Firefox, JavaScriptCore in Safari. The same code runs everywhere because all three implement the same language spec.",
        "The browser exposes APIs for nearly everything it can do: editing the DOM, making HTTP requests (fetch), storing data locally (localStorage), watching for scroll and click events, animating elements.",
        "It's single-threaded but non-blocking: slow tasks (network requests, timers) hand off to the browser and come back later via callbacks or promises. The main thread stays free for interaction.",
        "All of this runs on your machine, not the server. A site can be fully interactive with nothing but static files and a visitor's browser."
      ],
      terms: [
        { term: "JavaScript engine", def: "The program inside the browser that actually runs your JS code. V8 (Chrome) is the best-known; each major browser has its own." },
        { term: "DOM API", def: "The built-in set of functions JavaScript uses to read and modify the page — document.querySelector, element.addEventListener, and so on." },
        { term: "Event loop", def: "The mechanism that lets JavaScript be single-threaded without blocking. Queued callbacks run one at a time as the thread becomes free." }
      ]
    }
  }
};


document.addEventListener('DOMContentLoaded', () => {
  const nodes  = document.querySelectorAll('.a-node');
  const detail = document.getElementById('detail');
  const body   = document.getElementById('detailBody');


  /* ----------------------------------------------------------------
     2. RENDER — build the detail panel from a content entry.
     Uses DOM APIs (not innerHTML) so content is always treated as
     text, even though all copy is authored by us.
     ---------------------------------------------------------------- */
  function render(id) {
    const data = CONTENT[id];
    if (!data) return;

    const frag = document.createDocumentFragment();

    const eyebrow = document.createElement('p');
    eyebrow.className = 'a-detail-eyebrow';
    eyebrow.textContent = data.eyebrow;
    frag.appendChild(eyebrow);

    const name = document.createElement('h2');
    name.className = 'a-detail-name';
    name.textContent = data.name;
    frag.appendChild(name);

    // Acronym expansion line (only when the stop has one).
    if (data.expansion) {
      const expansion = document.createElement('p');
      expansion.className = 'a-detail-expansion';
      expansion.textContent = data.expansion;
      frag.appendChild(expansion);
    }

    const tagline = document.createElement('p');
    tagline.className = 'a-detail-tagline';
    tagline.textContent = data.tagline;
    frag.appendChild(tagline);

    const ul = document.createElement('ul');
    for (const b of data.bullets) {
      const li = document.createElement('li');
      li.textContent = b;
      ul.appendChild(li);
    }
    frag.appendChild(ul);

    if (data.note) {
      const note = document.createElement('p');
      note.className = 'a-detail-note';
      note.textContent = data.note;
      frag.appendChild(note);
    }

    /* --- Level 2: technical disclosure ---------------------------
       Uses a native <details> element. Collapsed by default, opens
       to reveal deeper technical bullets and an optional glossary.
       `<details>` is built-in to the browser, so we get keyboard
       activation, screen-reader announcements, and Space/Enter
       toggling for free — no extra ARIA needed.
       ------------------------------------------------------------- */
    if (data.technical) {
      const tech = document.createElement('details');
      tech.className = 'a-technical';

      const summary = document.createElement('summary');
      summary.className = 'a-technical-summary';
      summary.textContent = 'Technical details';
      tech.appendChild(summary);

      const techBody = document.createElement('div');
      techBody.className = 'a-technical-body';

      if (Array.isArray(data.technical.bullets)) {
        const techUl = document.createElement('ul');
        techUl.className = 'a-technical-bullets';
        for (const b of data.technical.bullets) {
          const li = document.createElement('li');
          li.textContent = b;
          techUl.appendChild(li);
        }
        techBody.appendChild(techUl);
      }

      // Optional glossary of terms. Rendered as a <dl> so screen
      // readers announce it as a definition list.
      if (Array.isArray(data.technical.terms) && data.technical.terms.length) {
        const dl = document.createElement('dl');
        dl.className = 'a-technical-glossary';
        for (const t of data.technical.terms) {
          const dt = document.createElement('dt');
          dt.textContent = t.term;
          dl.appendChild(dt);
          const dd = document.createElement('dd');
          dd.textContent = t.def;
          dl.appendChild(dd);
        }
        techBody.appendChild(dl);
      }

      tech.appendChild(techBody);
      frag.appendChild(tech);
    }

    body.replaceChildren(frag);
  }


  /* ----------------------------------------------------------------
     3. ACTIVATE — move the gold highlight to the clicked node,
     fade the panel out, swap content, fade back in.
     ---------------------------------------------------------------- */
  function activate(node) {
    nodes.forEach(n => {
      n.classList.remove('is-active');
      n.setAttribute('aria-selected', 'false');
    });
    node.classList.add('is-active');
    node.setAttribute('aria-selected', 'true');

    const id = node.dataset.id;
    detail.classList.add('is-swapping');
    setTimeout(() => {
      render(id);
      detail.classList.remove('is-swapping');
    }, 180);
  }


  /* ----------------------------------------------------------------
     4. KEYBOARD — Left/Right move through the row the node is in.
     ---------------------------------------------------------------- */
  function handleKeydown(node, e) {
    const row = node.parentElement;
    const rowNodes = Array.from(row.querySelectorAll('.a-node'));
    const idx = rowNodes.indexOf(node);
    if (e.key === 'ArrowRight' && idx < rowNodes.length - 1) {
      e.preventDefault();
      rowNodes[idx + 1].focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      rowNodes[idx - 1].focus();
    }
  }


  /* ----------------------------------------------------------------
     5. BOOT
     ---------------------------------------------------------------- */

  // Start with Stop 01 selected so the panel isn't empty on load.
  const initial = document.querySelector('[data-id="01"]');
  if (initial) {
    initial.classList.add('is-active');
    initial.setAttribute('aria-selected', 'true');
  }

  nodes.forEach(node => {
    node.addEventListener('click', () => activate(node));
    node.addEventListener('keydown', (e) => handleKeydown(node, e));
  });
});
