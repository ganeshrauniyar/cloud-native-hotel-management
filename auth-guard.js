/* Auth guard — redirect to login.html if there's no token.
   Loaded in <head> before the app so unauthenticated users never
   see the dashboard flash. */
(function () {
  var token = localStorage.getItem('hms_token');
  if (!token) {
    window.location.replace('login.html');
  }
})();
