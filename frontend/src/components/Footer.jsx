import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '16px',
      textAlign: 'center',
      fontSize: '13px',
      color: 'var(--muted)',
      marginTop: 'auto',
      background: 'var(--card)'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        <p style={{ margin: 0 }}>© {new Date().getFullYear()} LeadFlow CRM. All rights reserved.</p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => alert('Terms & Conditions: This is a demo MVP built for evaluation purposes.')}
            className="link"
          >
            Terms & Conditions
          </button>
          <button 
            onClick={() => alert('Privacy Policy: Your data is stored securely. We do not share it with third parties.')}
            className="link"
          >
            Privacy Policy
          </button>
          <a href="mailto:support@leadflow.com" style={{ color: 'var(--primary)' }}>Contact Support</a>
        </div>
      </div>
    </footer>
  );
}