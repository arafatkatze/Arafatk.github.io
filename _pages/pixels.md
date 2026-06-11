---
layout: page
title: Pixel Board
permalink: /pixels/
description: collaborative pixel art, leave your mark
nav: true
nav_order: 6
---

<div id="pixel-board-app">
  <div class="pixel-controls">
    <div class="color-palette">
      <span class="palette-label">color:</span>
      <div class="color-swatches" id="color-swatches"></div>
    </div>
    <div class="pixel-info" id="pixel-info">
      <span id="pixel-position">hover to see position</span>
      <span id="pixel-meta">click to place</span>
      <span id="pixel-count">0 pixels placed</span>
    </div>
  </div>
  <div class="pixel-grid-wrapper">
    <canvas id="pixel-canvas"></canvas>
  </div>
  <div class="pixel-actions">
    <button class="pixel-btn" id="download-board" title="Download as image">download</button>
    <button class="pixel-btn pixel-btn-primary" id="submit-board" title="Send your art to Arafat">submit</button>
  </div>
</div>

<!-- Submit Modal -->
<div id="pixel-submit-modal" class="pixel-submit-modal">
  <div class="pixel-submit-content">
    <button class="pixel-submit-close" id="pixel-submit-close" aria-label="Close">&times;</button>

    <div id="pixel-submit-form-state">
      <h4 class="pixel-submit-title">submit your pixel art</h4>
      <p class="pixel-submit-subtitle">
        Your board gets sent to me as an image — completely anonymous. Just drop a quick note with it so I know a human made it.
      </p>
      <div class="pixel-submit-preview">
        <img id="pixel-submit-preview-img" alt="Preview of your pixel art" />
        <span class="pixel-submit-caption" id="pixel-submit-caption"></span>
      </div>
      <form id="pixel-submit-form">
        <textarea
          id="pixel-submit-message"
          class="pixel-submit-textarea"
          rows="3"
          placeholder="say something about your creation..."
        ></textarea>
        <span class="pixel-submit-error" id="pixel-submit-error" style="display: none;"></span>
        <button type="submit" class="pixel-submit-btn" id="pixel-submit-btn">send it</button>
      </form>
    </div>

    <div id="pixel-submit-success-state" class="pixel-submit-success" style="display: none;">
      <div class="pixel-submit-success-icon"><i class="fa-solid fa-paper-plane"></i></div>
      <h4 class="pixel-submit-title">sent!</h4>
      <p class="pixel-submit-subtitle">Thanks for the pixels. I look at every single one of these.</p>
      <button class="pixel-btn" id="pixel-submit-done">back to the board</button>
    </div>
  </div>
</div>

<script src="{{ '/assets/js/pixel-board.js' | relative_url }}" defer></script>
