import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function PreRegistrationForm() {
  const [form, setForm] = useState({
    firstName: "",
    email: "",
    country: "",
    experience: "Beginner (1-2 years or learning)"
  });
  const [status, setStatus] = useState<"idle"|"loading"|"success"|"error">("idle");

  const handleSubmit = async () => {
    if (!form.firstName || !form.email) {
      alert("Please fill in your name and email.");
      return;
    }
    setStatus("loading");
    try {
      await addDoc(collection(db, "site_registrations"), {
        ...form,
        createdAt: serverTimestamp(),
        source: window.location.href
      });
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  if (status === "success") return (
    <div style={{textAlign:"center", color:"#00E4B4", padding:"40px"}}>
      <h2>✅ You're on the list.</h2>
      <p>We'll contact you at {form.email} when your account is ready.</p>
    </div>
  );

  return (
    <div style={{maxWidth:"600px", margin:"0 auto", padding:"40px 20px"}}>
      <h2 style={{textAlign:"center", color:"#fff", marginBottom:"30px"}}>
        JOIN THE WAITLIST
      </h2>

      <input
        placeholder="First Name"
        value={form.firstName}
        onChange={e => setForm({...form, firstName: e.target.value})}
        style={inputStyle}
      />

      <input
        placeholder="Email Address"
        type="email"
        value={form.email}
        onChange={e => setForm({...form, email: e.target.value})}
        style={inputStyle}
      />

      <input
        placeholder="Country"
        value={form.country}
        onChange={e => setForm({...form, country: e.target.value})}
        style={inputStyle}
      />

      <select
        value={form.experience}
        onChange={e => setForm({...form, experience: e.target.value})}
        style={inputStyle}
      >
        <option>Beginner (1-2 years or learning)</option>
        <option>Intermediate (3-5 years)</option>
        <option>Advanced (5-10 years)</option>
        <option>Expert (10+ years)</option>
        <option>Institutional (30+ years)</option>
      </select>

      <button
        onClick={handleSubmit}
        disabled={status === "loading"}
        style={buttonStyle}
      >
        {status === "loading" ? "SAVING..." : "RESERVE MY ACCOUNT →"}
      </button>

      {status === "error" && (
        <p style={{color:"red", textAlign:"center"}}>
          Something went wrong. Please try again.
        </p>
      )}

      <p style={{color:"#666", textAlign:"center", fontSize:"12px", marginTop:"16px"}}>
        🔒 Server-authenticated. Direct pipeline to waitlist collection.
      </p>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  marginBottom: "16px",
  background: "#111",
  border: "1px solid #333",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  boxSizing: "border-box"
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "18px",
  background: "linear-gradient(90deg, #ff00cc, #a855f7)",
  border: "none",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "18px",
  fontWeight: "bold",
  cursor: "pointer",
  marginTop: "8px"
};
