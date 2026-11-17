import React, { useEffect, useState } from "react";

const API = "http://localhost:5000";

export default function FabricDashboard({ onBack }) {
  const [role, setRole] = useState("farmer");
  const [batches, setBatches] = useState([]);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function request(url, options = {}) {
    const response = await fetch(API + url, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function refresh() {
    try {
      setBatches(await request("/api/batches"));
    } catch (e) {
      setMessage(e.message);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function act(action, batchId) {
    setBusy(true);
    setMessage("");
    try {
      await request(`/api/batches/${batchId}/${action}`, { method: "POST" });
      setMessage(`Batch ${batchId}: ${action} successful`);
      await refresh();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    setBusy(true);
    setMessage("");
    try {
      const numbers = batches.map(b => Number(String(b.id).replace(/\D/g, "")) || 0);
      const next = Math.max(0, ...numbers) + 1;
      const batchId = `DM${String(next).padStart(3, "0")}`;
      await request("/api/batches", {
        method: "POST",
        body: JSON.stringify({ id: batchId, name, quantity })
      });
      setMessage(`Created ${batchId} successfully`);
      setName("");
      setQuantity("");
      await refresh();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }

  const visible = batches.filter(b =>
    !search || String(b.id).toLowerCase().includes(search.toLowerCase()) ||
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const card = { background: "white", padding: 20, borderRadius: 12, border: "1px solid #e5e7eb" };
  const button = { padding: "10px 16px", border: 0, borderRadius: 7, cursor: "pointer", background: "#172554", color: "white", margin: 3 };
  const input = { padding: 11, border: "1px solid #cbd5e1", borderRadius: 7, width: "100%", boxSizing: "border-box", marginTop: 6 };

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", padding: "28px 5%", fontFamily: "Arial, sans-serif", color: "#172033" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 5 }}>D-Mart Supply Chain</h1>
          <p style={{ color: "#64748b" }}>Hyperledger Fabric Blockchain Dashboard</p>
        </div>
        <button style={button} onClick={onBack}>Switch to Ethereum / Sepolia</button>
      </header>

      <section style={{ ...card, marginTop: 20 }}>
        <strong>Fabric participant role</strong>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
          {["farmer", "distributor", "retailer"].map(r =>
            <button key={r} onClick={() => setRole(r)}
              style={{ ...button, background: role === r ? "#2563eb" : "#64748b" }}>
              {r.toUpperCase()}
            </button>
          )}
        </div>
        <small style={{ color: "#64748b" }}>Demo role selector. Each action is submitted using its corresponding Fabric identity.</small>
      </section>

      {message && <p style={{ ...card, marginTop: 15 }}>{message}</p>}

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, marginTop: 20 }}>
        {[
          ["Total batches", batches.length],
          ["Created", batches.filter(b => b.state === "Created").length],
          ["Shipped", batches.filter(b => b.state === "Shipped").length],
          ["Delivered", batches.filter(b => b.state === "Delivered").length]
        ].map(([label, value]) =>
          <div key={label} style={card}><span style={{ color: "#64748b" }}>{label}</span><h2>{value}</h2></div>
        )}
      </section>

      {role === "farmer" && <section style={{ ...card, marginTop: 20 }}>
        <h2>Create product batch</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
          <label>Product name<input style={input} value={name} onChange={e => setName(e.target.value)} placeholder="D-Mart product" /></label>
          <label>Quantity<input style={input} type="number" min="1" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Quantity" /></label>
        </div>
        <button style={button} disabled={busy || !name || !quantity || Number(quantity) <= 0} onClick={create}>Create batch</button>
      </section>}

      <section style={{ ...card, marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <h2>Blockchain supply chain records</h2>
          <button style={button} onClick={refresh}>Refresh ledger</button>
        </div>
        <input style={{ ...input, maxWidth: 350, marginBottom: 15 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batch ID or product" />
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead><tr>{["Batch ID", "Product", "Quantity", "Status", "Action"].map(x => <th key={x} style={{ padding: 12, borderBottom: "1px solid #ddd" }}>{x}</th>)}</tr></thead>
            <tbody>
              {visible.map(b => <tr key={b.id}>
                <td style={{ padding: 12 }}>{b.id}</td>
                <td style={{ padding: 12 }}>{b.name}</td>
                <td style={{ padding: 12 }}>{b.quantity}</td>
                <td style={{ padding: 12 }}><strong>{b.state}</strong></td>
                <td style={{ padding: 12 }}>
                  {role === "distributor" && b.state === "Created" && <button style={button} disabled={busy} onClick={() => act("ship", b.id)}>Ship</button>}
                  {role === "retailer" && b.state === "Shipped" && <button style={button} disabled={busy} onClick={() => act("deliver", b.id)}>Deliver</button>}
                  {(b.state === "Delivered" || (role === "farmer")) && "—"}
                </td>
              </tr>)}
              {visible.length === 0 && <tr><td colSpan="5" style={{ padding: 20 }}>No batches found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <footer style={{ textAlign: "center", color: "#64748b", marginTop: 25 }}>D-Mart • Hyperledger Fabric • supplychannel</footer>
    </div>
  );
}
