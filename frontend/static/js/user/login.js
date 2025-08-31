// ================== Login & SignUp Panels ==================
import { login, loginAsGuest, signup, logout, isLoggedIn, getUserInfo, getToken } from '../common/api_user.js';

class BasePanel {
  constructor(container) {
    this.container = container;
    this.panelElement = null;
    this.eventHandlers = [];
  }

  addEvent(el, type, handler) {
    if (!el) return;
    el.addEventListener(type, handler);
    this.eventHandlers.push({ el, type, handler });
  }

  removeAllEvents() {
    this.eventHandlers.forEach(({ el, type, handler }) => {
      el.removeEventListener(type, handler);
    });
    this.eventHandlers = [];
  }

  async mount() {
    await this.render();
    this.onMount?.();
  }

  unmount() {
    this.removeAllEvents();
    if (this.panelElement && this.container.contains(this.panelElement)) {
      this.container.removeChild(this.panelElement);
    }
    this.panelElement = null;
    this.onUnMount?.();
  }

  onMount() { }
  onUnMount() { }
}

// ================== LoginPanel ==================
class LoginPanel extends BasePanel {
  async render() {
    if (!this.container) return null;

    if (this.panelElement) {
      this.panelElement.innerHTML = '';
    } else {
      this.panelElement = document.createElement('div');
      this.panelElement.className = 'login-panel';
      this.container.appendChild(this.panelElement);
    }

    this.panelElement.innerHTML = `
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
        <a id="guest-login">Start as a guest</a>
      </div>
    `;

    const form = this.panelElement.querySelector('#loginForm');
    this.addEvent(form, 'submit', async e => {
      e.preventDefault();
      const username = this.panelElement.querySelector('#username').value;
      const password = this.panelElement.querySelector('#password').value;
      try {
        const data = await login(username, password);
        console.log('Login success:', data);
        window.location.href = '/#home';
      } catch (err) {
        alert('Login failed: ' + err.message);
      }
    });

    const guestBtn = this.panelElement.querySelector('#guest-login');
    this.addEvent(guestBtn, 'click', async () => {
      if (confirm('Guest login has limited access. Continue?')) {
        try {
          const data = await loginAsGuest();
          console.log('Guest login success:', data);
          window.location.href = '/#home';
        } catch (err) {
          alert('Guest login failed: ' + err.message);
        }
      }
    });

    return this.panelElement;
  }
}

// ================== SignUpPanel ==================
class SignUpPanel extends BasePanel {
  async render() {
    if (!this.container) return null;

    if (this.panelElement) {
      this.panelElement.innerHTML = '';
    } else {
      this.panelElement = document.createElement('div');
      this.panelElement.className = 'signup-panel';
      this.container.appendChild(this.panelElement);
    }

    this.panelElement.innerHTML = `
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

    const usernameInput = this.panelElement.querySelector('#newUsername');
    const usernameError = this.panelElement.querySelector('#usernameError');
    this.addEvent(usernameInput, 'blur', async () => {
      const username = usernameInput.value.trim();
      if (!username) {
        usernameError.textContent = 'Username is required.';
        usernameError.style.display = 'block';
      } else {
        usernameError.textContent = '';
        usernameError.style.display = 'none';
      }
      // TODO: 调用 API 检查用户名是否存在
    });

    const emailInput = this.panelElement.querySelector('#email');
    const emailError = this.panelElement.querySelector('#emailError');
    this.addEvent(emailInput, 'blur', () => {
      const email = emailInput.value.trim();
      if (!email) {
        emailError.textContent = 'Email is required.';
        emailError.style.display = 'block';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailError.textContent = 'Invalid email format.';
        emailError.style.display = 'block';
      } else {
        emailError.textContent = '';
        emailError.style.display = 'none';
      }
    });

    const form = this.panelElement.querySelector('#signUpForm');
    this.addEvent(form, 'submit', async e => {
      e.preventDefault();
      const newUsername = usernameInput.value.trim();
      const email = emailInput.value.trim();
      const newPassword = this.panelElement.querySelector('#newPassword').value;
      const confirmPassword = this.panelElement.querySelector('#confirmPassword').value;
      const passwordError = this.panelElement.querySelector('#passwordError');

      let valid = true;
      if (newPassword !== confirmPassword) {
        passwordError.textContent = 'Passwords do not match.';
        passwordError.style.display = 'block';
        valid = false;
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
        passwordError.textContent = 'Password must be at least 8 characters, include upper/lowercase and a number.';
        passwordError.style.display = 'block';
        valid = false;
      } else {
        passwordError.textContent = '';
        passwordError.style.display = 'none';
      }

      if (!valid) return;

      try {
        const data = await signup(newUsername, email, newPassword);
        console.log('Signup success:', data);
        window.location.href = '/#login';
      } catch (err) {
        alert('Signup failed: ' + err.message);
      }
    });

    return this.panelElement;
  }
}


// ================== Export ==================
export { LoginPanel, SignUpPanel, logout, isLoggedIn, getUserInfo, getToken };
