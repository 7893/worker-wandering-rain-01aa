export const pageTemplate = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#181b18">
  <meta name="description" content="A continuous impression of time. UTC and Hong Kong, read from one moving timeline.">
  <title>Wandering Rain — Time, in print.</title>
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='5' fill='%23181b18'/%3E%3Cpath d='M10 9h20v22H10z' fill='%23dbd8be'/%3E%3Cpath d='M20 5v30' stroke='%23d27348' stroke-width='2'/%3E%3C/svg%3E">
  <link rel="stylesheet" href="__STYLE_URL__">
  <script src="__SCRIPT_URL__" defer></script>
</head>
<body>
  <div class="workshop">
    <header><a href="/" class="brand"><span class="brand-mark" aria-hidden="true">w/r</span>WANDERING RAIN</a><span class="serial">TEMPORAL INSTRUMENT / 002</span></header>
    <main>
      <div class="introduction"><div><p class="eyebrow"><span class="status-dot"></span> A CONTINUOUS IMPRESSION</p><h1>Time,<br><span>in print.</span></h1></div><div class="principle"><div class="offset">08<span>h</span></div><p>One timeline. Two readings.<br>Always eight hours apart.</p><span class="small">UTC → HONG KONG</span></div></div>
      <section class="instrument" aria-label="UTC and Hong Kong time printing instrument">
        <div class="machine-label"><span>WR—02 / TIME PRESS</span><span class="machine-status"><i></i> LIVE FEED</span></div>
        <div id="machine" class="machine">
          <div class="paper" aria-hidden="true"></div><canvas id="material" aria-hidden="true"></canvas>
          <div class="rail rail-top" aria-hidden="true"></div><div class="rail rail-bottom" aria-hidden="true"></div>
          <div class="hour-feed" aria-hidden="true"><div id="hour-ticks" class="hour-ticks"></div><div id="hour-track" class="hour-track"></div></div>
          <div class="read-head utc-head"><span class="head-number">READ HEAD 01</span><span class="needle" aria-hidden="true"></span><div class="window"><span class="window-corner tl"></span><span class="window-corner tr"></span><span class="window-corner bl"></span><span class="window-corner br"></span><time id="utc-time" datetime="__ISO__">__UTC_TIME__</time><span class="seconds" id="utc-seconds" aria-hidden="true">__SECONDS__</span></div><div class="read-caption"><h2>Universal time</h2><span>UTC +00:00</span></div><p id="utc-date" class="date">__UTC_DATE__</p></div>
          <div class="read-head hkt-head"><span class="head-number">READ HEAD 02</span><span class="needle" aria-hidden="true"></span><div class="window"><span class="window-corner tl"></span><span class="window-corner tr"></span><span class="window-corner bl"></span><span class="window-corner br"></span><time id="hkt-time" datetime="__ISO__">__HKT_TIME__</time><span class="seconds" id="hkt-seconds" aria-hidden="true">__SECONDS__</span></div><div class="read-caption"><h2>Hong Kong</h2><span>HKT +08:00</span></div><p id="hkt-date" class="date">__HKT_DATE__</p><span id="day-offset" class="day-offset">__DAY_OFFSET__</span></div>
          <div class="seconds-feed" aria-hidden="true"><span class="feed-tag">SECONDS</span><div id="second-track" class="second-track"></div><span class="second-cursor"></span></div>
          <div class="roller roller-left" aria-hidden="true"></div><div class="roller roller-right" aria-hidden="true"></div>
        </div>
        <div class="machine-footer"><span>24-HOUR IMPRESSION</span><span class="calibration"><span>←</span> FIXED OFFSET · 08:00 <span>→</span></span><button id="motion" type="button" aria-pressed="false" hidden>Pause motion <span aria-hidden="true">Ⅱ</span></button></div>
      </section>
      <div class="legend"><span><i class="legend-line"></i> TIME PASSES THROUGH. THE READERS STAY.</span><span>NO TWO IMPRESSIONS ARE THE SAME.</span></div>
    </main>
    <footer><span>Built around the passing moment.</span><span class="footer-mark">W/R <span>©</span> TIME, IN PRINT.</span></footer>
    <noscript><p class="no-script">The readouts show the time this page was opened. Enable JavaScript for live time.</p></noscript>
  </div>
</body>
</html>
`;
