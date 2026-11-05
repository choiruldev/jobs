/**
 * In-Browser STAR Interview Speech Timer & Voice Practice Recorder
 * Allows candidates to record spoken answers and monitor speech duration (2-minute STAR limit).
 */

export function createVoicePracticeWidget(container, questionId) {
  let mediaRecorder = null;
  let audioChunks = [];
  let timerInterval = null;
  let secondsElapsed = 0;
  const MAX_SECONDS = 120; // 2 minutes STAR target

  container.innerHTML = `
    <div class="voice-practice-widget" style="background:var(--md-sys-color-surface-container);border-radius:12px;padding:16px;margin-top:14px;border:1px solid var(--md-sys-color-outline-variant);">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
        <div style="display:flex;align-items:center;gap:12px;">
          <button type="button" class="voice-record-btn voice-record-btn--idle js-record-btn" id="record-btn-${questionId}">
            <span class="material-symbols-outlined" style="font-size:18px;">mic</span>
            <span>Mulai Bicara (2 Min)</span>
          </button>
          <span class="js-timer-display" id="timer-${questionId}" style="font-family:monospace;font-size:15px;font-weight:700;color:var(--md-sys-color-primary);">00:00 / 02:00</span>
        </div>
        <span class="label-small js-speech-status" id="speech-status-${questionId}" style="color:var(--md-sys-color-outline);font-size:12px;">Target: < 2 menit</span>
      </div>

      <div style="width:100%;height:6px;background:var(--md-sys-color-outline-variant);border-radius:999px;margin:12px 0;overflow:hidden;">
        <div class="js-speech-bar" id="bar-${questionId}" style="width:0%;height:100%;background:var(--md-sys-color-primary);transition:width 1s linear;"></div>
      </div>

      <div class="js-audio-player-container" id="player-container-${questionId}" style="display:none;margin-top:10px;">
        <audio class="js-audio-player" id="audio-${questionId}" controls style="width:100%;height:40px;"></audio>
      </div>
    </div>
  `;

  const recordBtn = container.querySelector(`#record-btn-${questionId}`);
  const timerDisplay = container.querySelector(`#timer-${questionId}`);
  const speechStatus = container.querySelector(`#speech-status-${questionId}`);
  const progressBar = container.querySelector(`#bar-${questionId}`);
  const playerContainer = container.querySelector(`#player-container-${questionId}`);
  const audioPlayer = container.querySelector(`#audio-${questionId}`);

  function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        audioPlayer.src = audioUrl;
        playerContainer.style.display = "block";
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      secondsElapsed = 0;
      recordBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;">stop</span> <span>Selesai Bicara</span>`;
      recordBtn.className = "voice-record-btn voice-record-btn--recording js-record-btn";
      speechStatus.textContent = "Merekam suara...";
      speechStatus.style.color = "#dc2626";

      timerInterval = setInterval(() => {
        secondsElapsed++;
        timerDisplay.textContent = `${formatTime(secondsElapsed)} / 02:00`;
        const percent = Math.min(100, Math.round((secondsElapsed / MAX_SECONDS) * 100));
        progressBar.style.width = `${percent}%`;

        if (secondsElapsed > 90) {
          progressBar.style.background = "#c62828"; // Warning red
          speechStatus.textContent = "Mendekati batas 2 menit!";
        } else if (secondsElapsed > 60) {
          progressBar.style.background = "#f57c00"; // Orange
        } else {
          progressBar.style.background = "var(--md-sys-color-primary)";
        }

        if (secondsElapsed >= MAX_SECONDS) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      console.warn("Mikrofon tidak diizinkan atau tidak tersedia:", err);
      speechStatus.textContent = "Mikrofon tidak aktif. Izinkan akses mic di peramban.";
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    clearInterval(timerInterval);
    recordBtn.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;">mic</span> <span>Rekam Ulang</span>`;
    recordBtn.className = "voice-record-btn voice-record-btn--idle js-record-btn";
    speechStatus.textContent = `Latihan selesai (${secondsElapsed}s). Dengarkan rekaman Anda di bawah:`;
    speechStatus.style.color = "#16a34a";
  }

  recordBtn.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      stopRecording();
    } else {
      startRecording();
    }
  });
}
