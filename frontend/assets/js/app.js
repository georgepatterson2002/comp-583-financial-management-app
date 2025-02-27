<script>
    // JavaScript to toggle between Sign Up and Log In forms
    document.getElementById('loginLink').addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default link behavior
        document.getElementById('signup-container').style.display = 'none'; // Hide Sign Up form
        document.getElementById('loginContainer').style.display = 'block'; // Show Log In form
    });

    document.getElementById('signupLink').addEventListener('click', function(event) {
        event.preventDefault(); // Prevent default link behavior
        document.getElementById('loginContainer').style.display = 'none'; // Hide Log In form
        document.getElementById('signup-container').style.display = 'block'; // Show Sign Up form
    });
</script>//app.js
