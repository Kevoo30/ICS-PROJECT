import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/register.css";
import { useAppData } from "../context/AppDataContext";

function Register() {
  const navigate = useNavigate();
  const { registerUser } = useAppData();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    vehicleModel: "",
    numberPlate: "",
    connectorType: "Type 2",
    agreeToTerms: false,
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError("Full name, email, and password are required.");
      return;
    }

    if (!formData.vehicleModel.trim() || !formData.numberPlate.trim()) {
      setError("Vehicle model and number plate are required.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!formData.agreeToTerms) {
      setError("Please agree to the terms before creating an account.");
      return;
    }

    setError("");

    setIsSubmitting(true);

    try {
      await registerUser(formData);
      navigate("/login", {
        state: {
          registered: true,
          email: formData.email,
        },
      });
    } catch (submitError) {
      setError(submitError.message || "Unable to register.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="register-shell">
      <section className="register-card" aria-labelledby="register-title">
        <div className="register-header">
          <p className="register-kicker">EV Charging System</p>
          <h1 id="register-title">Create Account</h1>
          <p className="register-subtitle">
            Register once to book charging ports and manage your sessions.
          </p>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <label htmlFor="register-name">Full Name</label>
          <input
            id="register-name"
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={updateField}
            placeholder="Jane Doe"
            autoComplete="name"
            required
          />

          <label htmlFor="register-email">Email</label>
          <input
            id="register-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={updateField}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="register-phone">Phone Number</label>
          <input
            id="register-phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={updateField}
            placeholder="+254 712 345 678"
            autoComplete="tel"
          />

          <label htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            name="password"
            value={formData.password}
            onChange={updateField}
            placeholder="Create password"
            autoComplete="new-password"
            required
          />

          <label htmlFor="register-vehicle-model">Vehicle Model</label>
          <input
            id="register-vehicle-model"
            type="text"
            name="vehicleModel"
            value={formData.vehicleModel}
            onChange={updateField}
            placeholder="Nissan Leaf"
            required
          />

          <label htmlFor="register-number-plate">Number Plate</label>
          <input
            id="register-number-plate"
            type="text"
            name="numberPlate"
            value={formData.numberPlate}
            onChange={updateField}
            placeholder="KDA 123A"
            required
          />

          <label htmlFor="register-connector-type">Connector Type</label>
          <select
            id="register-connector-type"
            name="connectorType"
            value={formData.connectorType}
            onChange={updateField}
          >
            <option value="Type 1">Type 1</option>
            <option value="Type 2">Type 2</option>
            <option value="CCS">CCS</option>
            <option value="CHAdeMO">CHAdeMO</option>
          </select>

          <label htmlFor="register-confirm-password">Confirm Password</label>
          <input
            id="register-confirm-password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={updateField}
            placeholder="Repeat password"
            autoComplete="new-password"
            required
          />

          {error ? (
            <p className="register-error" role="alert">
              {error}
            </p>
          ) : null}

          <label className="register-terms" htmlFor="register-terms">
            <input
              id="register-terms"
              type="checkbox"
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={updateField}
            />
            I agree to the terms and privacy policy.
          </label>

          <button type="submit" className="register-btn" disabled={isSubmitting}>
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p className="register-footer">
          Already registered? <Link to="/login">Sign in here</Link>
        </p>
      </section>
    </main>
  );
}

export default Register;