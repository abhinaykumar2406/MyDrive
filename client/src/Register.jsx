import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css";

const BASE_URL = "http://127.0.0.1:4000";

function Register() {
  const [isLogin, setIsLogin] = useState(true);

  // React Router navigation
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "ak47",
    email: "ak@gmail.com",
    password: "1234",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = isLogin
      ? `${BASE_URL}/user/login`
      : `${BASE_URL}/user/register`;

    const data = isLogin
      ? {
          email: formData.email,
          password: formData.password,
        }
      : formData;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials:"include",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Something went wrong");
      }

      console.log(result);

      if (isLogin) {
        // Redirect to /directory
        navigate(`/directory/${result.rootDirId}`);
      } else {
        // Registration successful
        alert("Registration successful!");

        // Switch to login
        setIsLogin(true);

        setFormData({
          name: "",
          email: "ak@gmail.com",
          password: "1234",
        });
    }
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  return (
    <div className="register-page">
      <div className="auth-box">
        <h2>{isLogin ? "Login" : "Register"}</h2>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label>Name</label>

              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="input-group">
            <label>Email</label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label>Password</label>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit">
            {isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="toggle-text">
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            type="button"
            className="toggle-button"
            onClick={() => {
              setIsLogin(!isLogin);

              setFormData({
                name: "",
                email: "",
                password: "",
              });
            }}
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
