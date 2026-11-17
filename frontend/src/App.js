import { useState, useEffect } from "react";
import { ethers } from "ethers";
import abi from "./abi/SupplyChain.json";
import "./App.css";
import FabricDashboard from "./FabricDashboard";

const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS;

// =========================
// ROLE ADDRESSES
// =========================
const FARMER = process.env.REACT_APP_FARMER;
const DISTRIBUTOR = process.env.REACT_APP_DISTRIBUTOR;
const RETAILER = process.env.REACT_APP_RETAILER;

function App() {
  const [showFabric, setShowFabric] = useState(true);
  const [contract, setContract] = useState(null);

  const [wallet, setWallet] = useState("");
  const [role, setRole] = useState("");

  const [batchId, setBatchId] = useState(1);

  const [batch, setBatch] = useState(null);
  const [allBatches, setAllBatches] = useState([]);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [distributor, setDistributor] = useState("");
  const [retailer, setRetailer] = useState("");
  const [busyAction, setBusyAction] = useState("");

  // =========================
  // SHORT ADDRESS
  // =========================
  function shorten(addr) {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  // =========================
  // ROLE DETECTION
  // =========================
  function detectRole(address) {
    if (!address) return "";

    const addr = address.toLowerCase();

    if (addr === FARMER.toLowerCase()) return "FARMER";
    if (addr === DISTRIBUTOR.toLowerCase()) return "DISTRIBUTOR";
    if (addr === RETAILER.toLowerCase()) return "RETAILER";

    return "UNKNOWN";
  }

  // =========================
  // HANDLE ACCOUNT SWITCH
  // =========================
  useEffect(() => {
    if (!window.ethereum) return;

    async function handleAccountsChanged(accounts) {
      if (accounts.length === 0) return;

      const provider = new ethers.BrowserProvider(window.ethereum);

      const signer = await provider.getSigner();

      const address = accounts[0];

      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        abi,
        signer
      );

      setWallet(address);
      setRole(detectRole(address));
      setContract(contractInstance);

      await loadAllBatches(contractInstance);
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
    };
  }, []);

  // =========================
  // CONNECT WALLET
  // =========================
  async function connectWallet() {
    try {
      if (!window.ethereum) {
        return alert("Install MetaMask");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();

      const address = await signer.getAddress();

      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        abi,
        signer
      );

      setWallet(address);
      setRole(detectRole(address));
      setContract(contractInstance);

      await loadAllBatches(contractInstance);

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  }

  // =========================
  // LOAD ALL BATCHES
  // =========================
  async function loadAllBatches(instance) {
    if (!instance) return;

    const result = [];

    for (let id = 1; id <= 200; id++) {
      try {
        const data = await instance.getBatchReadable(id);

        result.push({
          id,
          name: data[0],
          quantity: data[1].toString(),
          state: data[2],
          farmer: data[3],
          distributor: data[4],
          retailer: data[5],
        });

      } catch {
        continue;
      }
    }

    setAllBatches(result);
  }

  // =========================
  // READ BATCH
  // =========================
  async function readBatch() {
    try {
      if (!contract) {
        return alert("Connect wallet first");
      }

      const data = await contract.getBatchReadable(Number(batchId));

      setBatch({
        name: data[0],
        quantity: data[1].toString(),
        state: data[2],
        farmer: data[3],
        distributor: data[4],
        retailer: data[5],
      });

    } catch (err) {
      console.error(err);
      alert("Batch not found");
    }
  }

  // =========================
  // CREATE BATCH (AUTO-ID)
  // =========================
  async function createBatch() {
    setBusyAction("create");
    try {
      if (!contract) {
        return alert("Connect wallet first");
      }

      if (role !== "FARMER") {
        return alert("Only FARMER can create batch");
      }

      // =========================
      // FIND NEXT FREE ID
      // =========================
      let nextId = 1;

      while (true) {
        try {
          await contract.getBatchReadable(nextId);
          nextId++;
        } catch {
          break;
        }
      }

      // =========================
      // CLEAN ADDRESSES
      // =========================
      const cleanDistributor = ethers.getAddress(
        distributor.trim()
      );

      const cleanRetailer = ethers.getAddress(
        retailer.trim()
      );

      // =========================
      // CREATE
      // =========================
      const tx = await contract.createBatch(
        nextId,
        name,
        Number(quantity),
        cleanDistributor,
        cleanRetailer
      );

      await tx.wait();

      alert(`Batch created with ID ${nextId}`);

      // optional UI update
      setBatchId(nextId + 1);

      // reload table
      await loadAllBatches(contract);

      // clear form
      setName("");
      setQuantity("");
      setDistributor("");
      setRetailer("");

    } catch (err) {
      console.error(err);
      alert(err.reason || err.message);
    } finally {
      setBusyAction("");
    }
  }

  // =========================
  // SHIP BATCH
  // =========================
  async function shipBatch(id) {
    setBusyAction(`ship-${id}`);
    try {
      if (role !== "DISTRIBUTOR") {
        return alert("Only DISTRIBUTOR can ship");
      }

      const tx = await contract.shipBatch(id);

      await tx.wait();

      alert("Batch shipped");

      await loadAllBatches(contract);

    } catch (err) {
      console.error(err);
      alert(err.reason || err.message);
    } finally {
      setBusyAction("");
    }
  }

  // =========================
  // DELIVER BATCH
  // =========================
  async function deliverBatch(id) {
    setBusyAction(`deliver-${id}`);
    try {
      if (role !== "RETAILER") {
        return alert("Only RETAILER can deliver");
      }

      const tx = await contract.deliverBatch(id);

      await tx.wait();

      alert("Batch delivered");

      await loadAllBatches(contract);

    } catch (err) {
      console.error(err);
      alert(err.reason || err.message);
    } finally {
      setBusyAction("");
    }
  }

  // =========================
  // UI
  // =========================
  const stateLabel = (state) => state || "Created";
  const statusClass = (state) => stateLabel(state).toLowerCase();
  const createdCount = allBatches.length;
  const shippedCount = allBatches.filter((item) => stateLabel(item.state) === "Shipped").length;
  const deliveredCount = allBatches.filter((item) => stateLabel(item.state) === "Delivered").length;
  const networkName = wallet
    ? ({ "0x1": "Ethereum Mainnet", "0x5": "Goerli", "0xaa36a7": "Sepolia", "0x539": "Localhost" }[
        window.ethereum?.chainId
      ] || `Chain ${window.ethereum?.chainId || "connected"}`)
    : "Not connected";

  if (showFabric) return <FabricDashboard onBack={() => setShowFabric(false)} />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">SC</div>
          <div><strong>SupplyChain</strong><span>Blockchain operations</span></div>
        </div>
        <nav className="side-nav" aria-label="Primary navigation">
          <a className="nav-item active" href="#overview"><span>▦</span>Overview</a>
          <a className="nav-item" href="#batches"><span>▤</span>Batch Management</a>
          <a className="nav-item" href="#tracking"><span>⌖</span>Product Tracking</a>
          <a className="nav-item" href="#records"><span>◈</span>Blockchain Records</a>
        </nav>
        <div className="sidebar-footer">
          <div className="nav-item"><span>◉</span>Wallet / Network</div>
          <div className="network-mini"><i />{networkName}</div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div>
            <p className="eyebrow">OPERATIONS CENTER</p>
            <h1>Supply chain overview</h1>
            <p className="muted">Monitor product movement and blockchain-backed fulfillment in one place.</p>
          </div>
          <div className="topbar-actions">
            {wallet && <div className="wallet-chip"><span className="wallet-dot" /><div><small>Connected wallet</small><strong>{shorten(wallet)}</strong></div></div>}
            {role && <div className="role-chip">{role}</div>}
            <button className="button button-dark" onClick={() => setShowFabric(true)}>Switch to Hyperledger Fabric</button>
            <button className="button button-primary" onClick={connectWallet}>{wallet ? "Reconnect wallet" : "Connect MetaMask"}</button>
          </div>
        </header>

        {!wallet && (
          <div className="connection-banner">
            <div className="banner-icon">↗</div>
            <div><strong>Connect your wallet to get started</strong><span>Connect MetaMask to view live batches and access role-based actions.</span></div>
            <button className="button button-dark" onClick={connectWallet}>Connect wallet</button>
          </div>
        )}

        <section className="stats-grid" aria-label="Batch statistics">
          <div className="stat-card"><div className="stat-icon blue">▤</div><div><span>Total batches</span><strong>{createdCount}</strong><small>On-chain records</small></div></div>
          <div className="stat-card"><div className="stat-icon purple">＋</div><div><span>Created batches</span><strong>{createdCount - shippedCount - deliveredCount}</strong><small>Awaiting shipment</small></div></div>
          <div className="stat-card"><div className="stat-icon orange">↗</div><div><span>In transit</span><strong>{shippedCount}</strong><small>Currently shipped</small></div></div>
          <div className="stat-card"><div className="stat-icon green">✓</div><div><span>Delivered</span><strong>{deliveredCount}</strong><small>Completed fulfillment</small></div></div>
        </section>

        <div className="content-grid">
          <section className="panel" id="batches">
            <div className="panel-heading"><div><p className="eyebrow">FARMER WORKSPACE</p><h2>Create a new batch</h2></div><span className="secure-label">◈ On-chain</span></div>
            <p className="panel-description">Register a product batch and assign its downstream supply chain partners.</p>
            <div className="form-grid">
              <label>Product name<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Organic coffee beans" /></label>
              <label>Quantity<input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Enter quantity" /></label>
              <label className="wide">Distributor wallet address<input value={distributor} onChange={(e) => setDistributor(e.target.value)} placeholder="0x..." /></label>
              <label className="wide">Retailer wallet address<input value={retailer} onChange={(e) => setRetailer(e.target.value)} placeholder="0x..." /></label>
            </div>
            <div className="form-footer"><span>{role === "FARMER" ? "You are authorized to create batches." : "Farmer authorization is required to create a batch."}</span><button className="button button-primary" onClick={createBatch} disabled={!contract || role !== "FARMER" || !name || !quantity || !distributor || !retailer || busyAction === "create"}>{busyAction === "create" ? "Creating..." : "Create batch"} <span>→</span></button></div>
          </section>

          <section className="panel tracking-panel" id="tracking">
            <div className="panel-heading"><div><p className="eyebrow">PRODUCT TRACKING</p><h2>Find a batch</h2></div><span className="search-symbol">⌕</span></div>
            <p className="panel-description">Search an individual blockchain record by its batch ID.</p>
            <div className="search-row"><input type="number" min="1" value={batchId} onChange={(e) => setBatchId(e.target.value)} placeholder="Batch ID" /><button className="button button-dark" onClick={readBatch}>Search batch</button></div>
            {batch ? <div className="result-card"><div className="result-title"><strong>Batch #{batchId}</strong><span className={`status-badge ${statusClass(batch.state)}`}>{stateLabel(batch.state)}</span></div><div className="result-grid"><div><small>Product</small><strong>{batch.name}</strong></div><div><small>Quantity</small><strong>{batch.quantity}</strong></div><div><small>Farmer</small><strong>{shorten(batch.farmer)}</strong></div><div><small>Distributor</small><strong>{shorten(batch.distributor)}</strong></div><div><small>Retailer</small><strong>{shorten(batch.retailer)}</strong></div></div></div> : <div className="search-empty"><span>⌕</span><p>Search results will appear here</p></div>}
          </section>
        </div>

        <section className="panel records-panel" id="records">
          <div className="panel-heading"><div><p className="eyebrow">LIVE LEDGER</p><h2>Supply chain records</h2><p className="muted">Every record below is retrieved directly from the connected contract.</p></div><button className="button button-outline" onClick={async () => { setBusyAction("refresh"); try { await loadAllBatches(contract); } finally { setBusyAction(""); } }} disabled={!contract || busyAction === "refresh"}><span>↻</span> {busyAction === "refresh" ? "Refreshing..." : "Refresh records"}</button></div>
          <div className="table-wrap">
            {allBatches.length === 0 ? <div className="table-empty"><div className="empty-icon">▤</div><h3>No batches to display</h3><p>Connect a wallet and refresh to load blockchain records.</p></div> : <table><thead><tr><th>Batch</th><th>Product</th><th>Quantity</th><th>Participants</th><th>Status</th><th>Progress</th><th>Actions</th></tr></thead><tbody>{allBatches.map((b) => {
              const currentState = stateLabel(b.state);
              return <tr key={b.id}><td><strong className="batch-number">#{b.id}</strong></td><td><strong>{b.name}</strong></td><td>{b.quantity} units</td><td><div className="participants"><span title={b.farmer}>F {shorten(b.farmer)}</span><span title={b.distributor}>D {shorten(b.distributor)}</span><span title={b.retailer}>R {shorten(b.retailer)}</span></div></td><td><span className={`status-badge ${statusClass(b.state)}`}><i />{currentState}</span></td><td><div className="progress"><span className="done" /><span className={currentState === "Shipped" || currentState === "Delivered" ? "done" : ""} /><span className={currentState === "Delivered" ? "done" : ""} /></div><small>{currentState === "Delivered" ? "Complete" : currentState === "Shipped" ? "In transit" : "Registered"}</small></td><td><div className="action-buttons"><button onClick={() => shipBatch(b.id)} disabled={role !== "DISTRIBUTOR" || currentState !== "Created" || Boolean(busyAction)}> {busyAction === `ship-${b.id}` ? "Shipping..." : "Ship"}</button><button onClick={() => deliverBatch(b.id)} disabled={role !== "RETAILER" || currentState !== "Shipped" || Boolean(busyAction)}> {busyAction === `deliver-${b.id}` ? "Delivering..." : "Deliver"}</button></div></td></tr>;
            })}</tbody></table>}
          </div>
        </section>
        <footer className="app-footer"><span>SupplyChain • Blockchain operations console</span><span><i /> {networkName}</span></footer>
      </main>
    </div>
  );
}

export default App;