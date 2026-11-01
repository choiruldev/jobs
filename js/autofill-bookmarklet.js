/**
 * 1-Click Form Autofill Bookmarklet Generator
 * Creates a browser bookmarklet that automatically fills application forms on Greenhouse, Lever, Ashby, and Workday.
 */

export function generateBookmarkletCode(profile = {}) {
  const data = {
    name: profile.name || "",
    firstName: (profile.name || "").split(" ")[0] || "",
    lastName: (profile.name || "").split(" ").slice(1).join(" ") || "",
    email: profile.email || "",
    phone: profile.phone || "",
    linkedin: profile.linkedin || "",
    github: profile.github || "",
    portfolio: profile.portfolio || "",
    location: profile.location || "Indonesia"
  };

  const code = `javascript:(function(){
    var d = ${JSON.stringify(data)};
    function set(sel, val) {
      if(!val) return;
      var el = document.querySelector(sel);
      if(el) {
        el.value = val;
        el.dispatchEvent(new Event('input', {bubbles:true}));
        el.dispatchEvent(new Event('change', {bubbles:true}));
        el.style.backgroundColor = '#e8f5e9';
      }
    }
    // Name
    set('input[name*="first_name" i], input[autocomplete="given-name"]', d.firstName);
    set('input[name*="last_name" i], input[autocomplete="family-name"]', d.lastName);
    set('input[name*="name" i]:not([name*="first"]):not([name*="last"]), input[autocomplete="name"]', d.name);
    // Email & Phone
    set('input[type="email"], input[name*="email" i], input[autocomplete="email"]', d.email);
    set('input[type="tel"], input[name*="phone" i], input[autocomplete="tel"]', d.phone);
    // Social / Links
    set('input[name*="linkedin" i], input[placeholder*="linkedin" i]', d.linkedin);
    set('input[name*="github" i], input[placeholder*="github" i]', d.github);
    set('input[name*="portfolio" i], input[name*="website" i]', d.portfolio);
    // Location
    set('input[name*="location" i], input[placeholder*="location" i]', d.location);
    alert('JobSearch Autofill: Data pelamar berhasil diisikan ke form!');
  })();`;

  return code.replace(/\s+/g, " ").trim();
}
