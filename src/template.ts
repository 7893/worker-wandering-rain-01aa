export const pageTemplate = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#eeeae3">
  <meta name="description" content="One moment, two places. A quiet gallery of time in UTC and Hong Kong.">
  <title>Wandering Rain — A gallery of time</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%23eeeae3'/%3E%3Cpath d='M12 29V17a8 8 0 0 1 16 0v12M9 29h22' fill='none' stroke='%2355524a' stroke-width='2'/%3E%3C/svg%3E">
  <link rel="stylesheet" href="__STYLE_URL__">
  <script src="__SCRIPT_URL__" defer></script>
</head>
<body>
  <div class="gallery">
    <header class="masthead">
      <a class="brand" href="/" aria-label="Wandering Rain home"><span class="mark" aria-hidden="true"></span>Wandering Rain</a>
      <span class="edition">A GALLERY OF TIME <span class="edition-number">— 001</span></span>
    </header>
    <main>
      <div class="introduction">
        <h1>One moment.<br><em>Two places.</em></h1>
        <div class="curator"><span class="eyebrow">AN EXERCISE IN STILLNESS</span><p>Time moves quietly.<br>We give it a little room.</p></div>
      </div>
      <div class="exhibits">
        <section class="exhibit utc" aria-labelledby="utc-name">
          <canvas class="light" aria-hidden="true"></canvas>
          <div class="exhibit-heading"><span class="index">01</span><h2 id="utc-name">Universal time</h2><span class="zone">UTC +00:00</span></div>
          <div class="clock">
            <p class="place">THE COMMON REFERENCE</p>
            <div class="time-row"><time id="utc-time" class="digits" datetime="__ISO__">__UTC_TIME__</time><span id="utc-seconds" class="seconds" aria-hidden="true">__SECONDS__</span></div>
            <p id="utc-date" class="date">__UTC_DATE__</p>
          </div>
          <div class="day-scale" aria-hidden="true"><div class="scale-track"><span id="utc-progress" class="scale-position" style="left:__UTC_PROGRESS__%"></span></div><div class="scale-labels"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div></div>
        </section>
        <section class="exhibit hkt" aria-labelledby="hkt-name">
          <canvas class="light" aria-hidden="true"></canvas>
          <div class="exhibit-heading"><span class="index">02</span><h2 id="hkt-name">Hong Kong</h2><span class="zone">HKT +08:00</span></div>
          <div class="clock">
            <p class="place">EIGHT HOURS AHEAD <span id="day-offset">__DAY_OFFSET__</span></p>
            <div class="time-row"><time id="hkt-time" class="digits" datetime="__ISO__">__HKT_TIME__</time><span id="hkt-seconds" class="seconds" aria-hidden="true">__SECONDS__</span></div>
            <p id="hkt-date" class="date">__HKT_DATE__</p>
          </div>
          <div class="day-scale" aria-hidden="true"><div class="scale-track"><span id="hkt-progress" class="scale-position" style="left:__HKT_PROGRESS__%"></span></div><div class="scale-labels"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div></div>
        </section>
      </div>
      <div class="gallery-caption"><span>TWO READINGS OF THE SAME INSTANT</span><span class="caption-rule" aria-hidden="true"></span><span>ALWAYS EIGHT HOURS APART</span></div>
    </main>
    <footer><span class="signature">A little room for <em>the present.</em></span><button id="motion" type="button" aria-pressed="false" hidden><span class="motion-dot" aria-hidden="true"></span><span id="motion-label">Pause light</span></button></footer>
    <noscript><p class="no-script">This is the time when the page was opened. Enable JavaScript for a live clock.</p></noscript>
  </div>
</body>
</html>
`;
