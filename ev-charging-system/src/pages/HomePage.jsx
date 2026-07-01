import React from "react";
import { Link } from "react-router-dom";
import "../styles/home.css";

const features = [
  { title: "Virtual queue", desc: "Join the queue remotely and get notified when your slot is ready.", tone: "tone-blue" },
  { title: "Advance booking", desc: "Reserve your charging slot before arriving at the station.", tone: "tone-green" },
  { title: "Online payment", desc: "Pay for charging sessions securely through the integrated payment gateway.", tone: "tone-amber" },
  { title: "Notifications", desc: "Receive real-time alerts for bookings, queue updates, and charging status.", tone: "tone-rose" },
  { title: "Role management", desc: "Separate dashboards for drivers, operators, and administrators.", tone: "tone-violet" },
  { title: "Priority charging", desc: "Request priority access when your battery level is critically low.", tone: "tone-orange" },
];

const HomePage = () => {
  return (
    <div className="home-page">
      <header className="home-nav">
        <div className="home-brand">
          <span className="home-badge">⚡</span>
          <div>
            <strong>EV Charge</strong>
            <small>Smart Charging System</small>
          </div>
        </div>
        <div className="home-nav-actions">
          <Link className="btn btn-secondary" to="/login">Sign in</Link>
          <Link className="btn btn-primary" to="/register">Get started</Link>
        </div>
      </header>

      <section className="home-hero">
        <p className="home-kicker">Smart EV Charging Management</p>
        <h1>
          Charge smarter, <span>queue better</span>
        </h1>
        <p className="home-subtitle">
          Book charging slots, join virtual queues, and manage your EV charging sessions - all in one place. No more waiting in line.
        </p>
      </section>

      <section className="home-stats">
        {[
          ["Real-time", "Queue updates"],
          ["Instant", "Slot booking"],
          ["Secure", "Online payments"],
          ["24/7", "System availability"],
        ].map(([num, label]) => (
          <article key={label} className="home-stat-item">
            <strong>{num}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      <section className="home-features">
        <h2>Everything you need to manage EV charging</h2>
        <div className="home-feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className="home-feature-card">
              <div className={`home-feature-icon ${feature.tone}`}>⚡</div>
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="home-footer">© 2026 EV Charge - Online EV Charging Queue Management System</footer>
    </div>
  );
};

export default HomePage;
