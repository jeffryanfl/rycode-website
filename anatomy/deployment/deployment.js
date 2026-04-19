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
    note: "In practice: this entire site was built using Claude Code."
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
    note: "In practice: the folder for this site holds a few dozen files, total. Small enough to email as a zip."
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
    note: "In practice: the commit history for this page is public — you can see every change ever made to it."
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
    note: "In practice: the push that delivered this page happened somewhere between a few hours and a few days before you opened it."
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
    note: "In practice: the repository powering this page is public. Every line of code is readable by anyone with the link."
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
    note: "In practice: each deploy of this site takes about 30 seconds from \"pushed\" to \"live.\""
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
    note: "In practice: the file that drew this page probably came from a server less than 500 miles from where you're sitting."
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
    note: "In practice: when you loaded this page, your computer asked DNS once and got an address back in under a tenth of a second."
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
    note: "In practice: the browser you're reading this in just did exactly that, moments ago."
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
    note: "In practice: any browser will show you this page's HTML via a \"View Source\" command, usually under the View menu."
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
    note: "In practice: try this page in your browser's \"Reader Mode\" — it strips the CSS away and shows what HTML alone looks like."
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
    note: "In practice: if you disabled JavaScript in your browser settings, this page would still load — but the nodes wouldn't respond to clicks."
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
