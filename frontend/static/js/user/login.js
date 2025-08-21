


export function renderLoginComponent() {
  // generate the HTML elements for the login form
  const loginForm = `
    <form id="loginForm">
      <div>
        <label for="username">Username:</label>
        <input type="text" id="username" name="username" required>
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required>
      </div>
      <button type="submit">Login</button>
    </form>
    <div>
      <a href="/#signup">Don't have an account? Sign up</a>
    </div>
  `;
  let container = document.createElement('login-div');
  container.innerHTML = loginForm;

  // Add event listener for form submission
  container.querySelector('#loginForm').addEventListener(
    'submit', function(event) {
    event.preventDefault(); // Prevent the default form submission
    const username = document.querySelector('#username').value;
    const password = document.querySelector('#password').value;
    // Here you would typically handle the login logic, e.g., sending a request to the server
    console.log('Username:', username);
    console.log('Password:', password);
    login(username, password)
      .then(data => {
        console.log('Login successful:', data);
        // Redirect to the main page or show a success message
        window.location.href = '/#home'; // Redirect to the main page after successful login
      })
      .catch(error => {
        console.error('Login failed:', error);
        // Show error message to the user
        alert('Login failed: ' + error.message);
      });
    }
  );

  return container;
}

export function renderSignUpComponent() {
  // generate the HTML elements for the signup form
  const signUpForm = `
    <form id="signUpForm">
      <div>
        <label for="newUsername">Username:</label>
        <input type="text" id="newUsername" name="newUsername" required>
        <span id="usernameError" style="color:red; font-size:12px; display:none;"></span>
      </div>
      <div>
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required>
        <span id="emailError" style="color:red; font-size:12px; display:none;"></span>
      </div>
      <div>
        <label for="newPassword">Password:</label>
        <input type="password" id="newPassword" name="newPassword" required>
      </div>
      <div>
        <label for="confirmPassword">Confirm Password:</label>
        <input type="password" id="confirmPassword" name="confirmPassword" required>
        <span id="passwordError" style="color:red; font-size:12px; display:none;"></span>
      </div>
      <button type="submit">Sign Up</button>
    </form>
    <div>
      <a href="/#login">Already have an account? Login</a>
    </div>
  `;
  let container = document.createElement('signup-div');
  container.innerHTML = signUpForm;

  // Username existence check (simulate async check)
  const usernameInput = container.querySelector('#newUsername');
  const usernameError = container.querySelector('#usernameError');
  usernameInput.addEventListener('blur', async function() {
    const username = usernameInput.value.trim();
    if (!username) {
      usernameError.textContent = 'Username is required.';
      usernameError.style.display = 'block';
      return;
    }
    // Simulate async existence check (replace with real API call)
    const exists = false; // Assume username does not exist
    if (exists) {
      usernameError.textContent = 'Username already exists.';
      usernameError.style.display = 'block';
    } else {
      usernameError.textContent = '';
      usernameError.style.display = 'none';
    }
  });

  // Email format check
  const emailInput = container.querySelector('#email');
  const emailError = container.querySelector('#emailError');
  function isEmailValid(email) {
    // Simple email regex
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  emailInput.addEventListener('blur', function() {
    const email = emailInput.value.trim();
    if (!email) {
      emailError.textContent = 'Email is required.';
      emailError.style.display = 'block';
    } else if (!isEmailValid(email)) {
      emailError.textContent = 'Invalid email format.';
      emailError.style.display = 'block';
    } else {
      emailError.textContent = '';
      emailError.style.display = 'none';
    }
  });

  // Password security check
  function isPasswordSecure(password) {
    // At least 8 chars, 1 uppercase, 1 lowercase, 1 number
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
  }

  // Add event listener for form submission
  container.querySelector('#signUpForm').addEventListener(
    'submit', function(event) {
      event.preventDefault();
      const newUsername = usernameInput.value.trim();
      const email = emailInput.value.trim();
      const newPassword = container.querySelector('#newPassword').value;
      const confirmPassword = container.querySelector('#confirmPassword').value;
      let valid = true;

      // Username check
      if (!newUsername) {
        usernameError.textContent = 'Username is required.';
        usernameError.style.display = 'block';
        valid = false;
      } else {
        usernameError.textContent = '';
        usernameError.style.display = 'none';
      }

      // Email check
      if (!email) {
        emailError.textContent = 'Email is required.';
        emailError.style.display = 'block';
        valid = false;
      } else if (!isEmailValid(email)) {
        emailError.textContent = 'Invalid email format.';
        emailError.style.display = 'block';
        valid = false;
      } else {
        emailError.textContent = '';
        emailError.style.display = 'none';
      }

      // Password match and security check
      const passwordError = container.querySelector('#passwordError');
      if (newPassword !== confirmPassword) {
        passwordError.textContent = 'Passwords do not match.';
        passwordError.style.display = 'block';
        valid = false;
      } else if (!isPasswordSecure(newPassword)) {
        passwordError.textContent = 'Password must be at least 8 characters, include uppercase, lowercase, and a number.';
        passwordError.style.display = 'block';
        valid = false;
      } else {
        passwordError.textContent = '';
        passwordError.style.display = 'none';
      }

      if (!valid) return;

      // Here you would typically handle the signup logic, e.g., sending a request to the server
      console.log('New Username:', newUsername);
      console.log('Email:', email);
      console.log('New Password:', newPassword);
      
      signup(newUsername, email, newPassword)
        .then(data => {
          console.log('Signup successful:', data);
          // Redirect to login or show success message
          window.location.href = '/#login';
        }
        )
        .catch(error => {
          console.error('Signup failed:', error);
          // Show error message to the user
          alert('Signup failed: ' + error.message);
        }
      );
    }
  );

  return container;
}


function signup(username, email, password) {
  // API: POST /api/user/signup
  return fetch('/api/user/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: username,
      useremail: email,
      userpassword: password
    })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => {
        throw new Error(err.error || 'Signup failed');
      });
    }   return response.json();
  }
  )
  .then(data => {
    console.log('Signup successful:', data);
    return data;
  }
  )
  .catch(error => {
    console.error('Error during signup:', error);
    throw error;
  }
  );
}


function login(username, password) {
  // API: POST /api/user/login
  return fetch('/api/user/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      username: username,
      userpassword: password
    })
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => {
        throw new Error(err.error || 'Login failed');
      });
    }
    return response.json();
  }
  )
  .then(data => {
    console.log('Login successful:', data);
    // Store the token in localStorage or sessionStorage
    localStorage.setItem('token', data.token);
    return data;
  }
  )
  .catch(error => {
    console.error('Error during login:', error);
    throw error;
  }
  );
}

export function logout() {
  // just remove the token from storage
  localStorage.removeItem('token');
  console.log('Logged out successfully');
  return Promise.resolve({ message: 'Logout successful' });
}


export function getUserInfo() {
  // return local information from localStorage
  const token = localStorage.getItem('token');
  if (!token) {
    return Promise.reject(new Error('User not logged in'));
  }
  // Decode the token to get user info (assuming JWT)
  const payload = JSON.parse(atob(token.split('.')[1]));
  return Promise.resolve({
    username: payload.username,
    email: payload.useremail
  });
}