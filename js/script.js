/**
 * Dear Diary - Splash Screen Driver
 */
document.addEventListener('DOMContentLoaded', () => {
  const skipButton = document.getElementById('skip-button');
  const dateEl = document.getElementById('current-date');
  
  let isRedirecting = false;

  // 1. Dynamic Date Display in Diary Header
  if (dateEl) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const today = new Date();
    dateEl.textContent = today.toLocaleDateString('en-US', options);
  }

  /**
   * Smoothly fades the entire viewport to black and redirects to onboarding
   */
  function redirectToOnboarding() {
    if (isRedirecting) return;
    isRedirecting = true;

    // Add page-fade-out class to body to trigger CSS opacity transition
    document.body.classList.add('page-fade-out');

    // Wait for the body opacity fade transition (0.6s) before redirecting
    setTimeout(() => {
      window.location.href = 'pages/onboarding.html';
    }, 600);
  }

  // 2. Skip Button handling
  // Show skip button after 1s (1000ms)
  setTimeout(() => {
    if (skipButton && !isRedirecting) {
      skipButton.classList.add('show');
    }
  }, 1000);

  if (skipButton) {
    skipButton.addEventListener('click', (e) => {
      e.preventDefault();
      redirectToOnboarding();
    });
  }

  // 3. Automatic loading completion timer
  // Slide-in (1s) + Loader Fade-in (0.4s) + Loading animation duration (2.5s) = 3.9s total loading
  // We trigger the smooth fade out and redirect at 4.0 seconds
  setTimeout(() => {
    if (!isRedirecting) {
      redirectToOnboarding();
    }
  }, 4000);
});
