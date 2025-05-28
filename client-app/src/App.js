import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import './App.css';

const PROOF_OPTIONS = [
  {
    label: 'Proof of Life',
    request: {
      id: 1,
      circuitId: 'credentialAtomicQueryV3-beta.1',
      query: {
        allowedIssuers: ['*'],
        type: 'AnimaProofOfLife',
        context:
          'https://raw.githubusercontent.com/anima-protocol/claims-polygonid/main/schemas/json-ld/pol-v1.json-ld',
      },
    },
  },
  {
    label: 'Age Over 18',
    request: {
      id: 1,
      circuitId: 'credentialAtomicQueryV3-beta.1',
      query: {
        allowedIssuers: ['*'],
        type: 'KYCAgeCredential',
        context:
          'https://raw.githubusercontent.com/iden3/protocols/master/polygonid/examples/ageCredential/schema.json-ld',
        // You could also add numeric conditions here if desired,
        // e.g. credentialSubject: { birthDate: { lt: 20060101 } }
      },
    },
  },
  {
    label: 'Membership Proof',
    request: {
      id: 1,
      circuitId: 'credentialAtomicQueryV3-beta.1',
      query: {
        allowedIssuers: ['*'],
        type: 'DAOAccessCredential',
        context: 'https://example.com/schemas/daoAccess.json-ld',
      },
    },
  },
];

function App() {
  const [baseRequest, setBaseRequest] = useState(null);
  const [error, setError] = useState();
  const [selectedProof, setSelectedProof] = useState(null);
  const [connected, setConnected] = useState(false);

  // 1) Fetch the "shell" authRequest from your backend (no proof scope yet)
  useEffect(() => {
    async function fetchAuth() {
      try {
        const res = await fetch(`http://localhost:8080/api/sign-in`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        console.log(json);
        setBaseRequest(json);
      } catch (err) {
        console.error(err);
        setError('Failed to load auth request');
      }
    }
    fetchAuth();
  }, []);

  // 2) Listen for the extension's response event
  useEffect(() => {
    function handleAuthResponse(e) {
      console.log('Received proof:', e.detail);
      setConnected(true);
      console.log("success");
    }
    window.addEventListener('authResponseEvent', handleAuthResponse);
    return () => window.removeEventListener('authResponseEvent', handleAuthResponse);
  }, []);

  if (error) {
    return (
      <div className="container">
        <p className="error">{error}</p>
      </div>
    );
  }
  if (!baseRequest) {
    return (
      <div className="container">
        <p>Loading…</p>
      </div>
    );
  }

  // Build a fresh request whenever the user picks a proof
  let requestWithScope = null;
  let encoded = '';
  let walletLink = '';
  if (selectedProof) {
    // deep-clone the base
    requestWithScope = JSON.parse(JSON.stringify(baseRequest));
    // override scope
    requestWithScope.body.scope = [selectedProof.request];
    encoded = btoa(JSON.stringify(requestWithScope));
    console.log("encoded", encoded);
    // for extension flow: dispatchEvent
    walletLink = `https://wallet.privado.id/#auth?type=base64&payload=${encoded}`;
  
  }

  return (
    <div className="container">
      <div className="header">Verify with Echo ID</div>

      {/* Proof selection */}
      <div className="subheader">Choose a proof type:</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        {PROOF_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            className="action-button"
            onClick={() => {
              setSelectedProof(opt);
              setConnected(false);
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {selectedProof && (
        <>
          {/* Deep-link button */}
          <div className="subheader">Click to invoke your browser wallet:</div>
          <button
            className="action-button"
            onClick={() => {
              // trigger the extension flow
              window.dispatchEvent(
                new CustomEvent('authEvent', {
                  detail: requestWithScope,
                })
              );
            }}
          >
            Use Browser Extension
          </button>

          {/* Mobile wallet link */}
          <a href={walletLink} target="_blank" rel="noopener noreferrer" className="action-button">
            Use Mobile Wallet
          </a>

          {/* QR code */}
          <div className="subheader">Or scan this QR code:</div>
          <div id="qrcode">
            <QRCodeCanvas value={JSON.stringify(requestWithScope)} size={256} level="Q" includeMargin />
          </div>

          {/* Success message */}
          {connected && (
            <div style={{ marginTop: 20, color: 'green', fontWeight: 'bold' }}>
              ✅ Successfully connected!
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
