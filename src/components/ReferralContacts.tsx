/**
 * ReferralContacts Component - Manages referral contacts for a job posting
 * Requirements: 5.1, 5.4, 5.5
 */

import { useState, useCallback } from 'react';
import type { ReferralContact, ReferralStatus, ReferralOutreachStatus } from '../types';

interface ReferralContactsProps {
  contacts: ReferralContact[];
  outreachStatus: ReferralOutreachStatus;
  onAddContact: (contact: { name: string; contactMethod: string }) => void;
  onUpdateStatus: (contactId: string, status: ReferralStatus) => void;
  onRemoveContact: (contactId: string) => void;
  onOutreachStatusChange: (status: ReferralOutreachStatus) => void;
}

const allStatuses: ReferralStatus[] = ['Not Contacted', 'Contacted', 'Referral Received', 'No Response'];

/**
 * Status badge color mapping for referral status
 */
const statusColors: Record<ReferralStatus, { bg: string; text: string }> = {
  'Not Contacted': { bg: 'bg-gray-100', text: 'text-gray-700' },
  'Contacted': { bg: 'bg-blue-100', text: 'text-blue-700' },
  'Referral Received': { bg: 'bg-green-100', text: 'text-green-700' },
  'No Response': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
};

/**
 * Outreach status options with colors
 */
const outreachStatusOptions: {
  value: ReferralOutreachStatus;
  label: string;
  bg: string;
  text: string;
  border: string;
}[] = [
  { value: 'Have to Find', label: '🔍 Have to Find', bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  { value: 'Found Contact', label: '👤 Found Contact', bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  { value: 'Messaged', label: '✉️ Messaged', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  { value: 'Got Referral', label: '✅ Got Referral', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  { value: 'No Response', label: '😐 No Response', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  { value: 'Declined', label: '❌ Declined', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
];

/**
 * Format date for display
 */
function formatDate(isoDate: string | null): string {
  if (!isoDate) return '—';
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * ContactCard component - displays a single contact with status dropdown
 * Requirements: 5.4, 5.5
 */
function ContactCard({
  contact,
  onUpdateStatus,
  onRemove,
}: {
  contact: ReferralContact;
  onUpdateStatus: (status: ReferralStatus) => void;
  onRemove: () => void;
}) {
  const { bg, text } = statusColors[contact.status];

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 truncate">{contact.name}</p>
        <p className="text-sm text-gray-500 truncate">{contact.contactMethod}</p>
        {contact.dateContacted && (
          <p className="text-xs text-gray-400 mt-1">
            Contacted: {formatDate(contact.dateContacted)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 ml-4">
        {/* Status dropdown - Requirements: 5.4, 5.5 */}
        <select
          value={contact.status}
          onChange={(e) => onUpdateStatus(e.target.value as ReferralStatus)}
          className={`px-2 py-1 text-xs font-medium rounded-lg ${bg} ${text} border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer`}
          aria-label={`Status for ${contact.name}`}
        >
          {allStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {/* Remove button */}
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          aria-label={`Remove ${contact.name}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * AddContactForm component - form to add a new referral contact
 * Requirements: 5.1, 5.2
 */
function AddContactForm({
  onAdd,
  onCancel,
}: {
  onAdd: (contact: { name: string; contactMethod: string }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [contactMethod, setContactMethod] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (name.trim() && contactMethod.trim()) {
        onAdd({ name: name.trim(), contactMethod: contactMethod.trim() });
        setName('');
        setContactMethod('');
      }
    },
    [name, contactMethod, onAdd]
  );

  return (
    <form onSubmit={handleSubmit} className="p-3 bg-blue-50 rounded-lg space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="contact-name" className="block text-xs font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contact name"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label htmlFor="contact-method" className="block text-xs font-medium text-gray-700 mb-1">
            Contact Method
          </label>
          <input
            id="contact-method"
            type="text"
            value={contactMethod}
            onChange={(e) => setContactMethod(e.target.value)}
            placeholder="LinkedIn, Email, etc."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || !contactMethod.trim()}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add Contact
        </button>
      </div>
    </form>
  );
}

/**
 * ReferralContacts component - displays list of contacts with management functionality
 * Requirements: 5.1, 5.4, 5.5
 */
export function ReferralContacts({
  contacts,
  outreachStatus,
  onAddContact,
  onUpdateStatus,
  onRemoveContact,
  onOutreachStatusChange,
}: ReferralContactsProps) {
  const [isAddingContact, setIsAddingContact] = useState(false);

  // Handle adding a contact - auto-update outreach status to "Found Contact" if it was "Have to Find"
  const handleAddContact = useCallback(
    (contact: { name: string; contactMethod: string }) => {
      onAddContact(contact);
      if (!outreachStatus || outreachStatus === 'Have to Find') {
        onOutreachStatusChange('Found Contact');
      }
      setIsAddingContact(false);
    },
    [onAddContact, outreachStatus, onOutreachStatusChange]
  );

  // Handle contact status update - auto-update outreach status based on contact statuses
  const handleContactStatusUpdate = useCallback(
    (contactId: string, status: ReferralStatus) => {
      onUpdateStatus(contactId, status);
      
      // Auto-update outreach status based on contact status
      if (status === 'Referral Received') {
        onOutreachStatusChange('Got Referral');
      } else if (status === 'Contacted' && (!outreachStatus || outreachStatus === 'Found Contact')) {
        onOutreachStatusChange('Messaged');
      }
    },
    [onUpdateStatus, outreachStatus, onOutreachStatusChange]
  );

  // Handle legacy jobs that don't have referralOutreachStatus
  const currentOutreachStatus = outreachStatus || 'Have to Find';
  const currentStatusConfig = outreachStatusOptions.find(o => o.value === currentOutreachStatus) || outreachStatusOptions[0];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Referral Contacts ({contacts.length})
          </h3>
          
          {/* Outreach Status Dropdown */}
          <select
            value={currentOutreachStatus}
            onChange={(e) => onOutreachStatusChange(e.target.value as ReferralOutreachStatus)}
            className={`px-2 py-1 text-xs font-medium rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              currentStatusConfig?.bg || 'bg-gray-100'
            } ${
              currentStatusConfig?.text || 'text-gray-700'
            } ${
              currentStatusConfig?.border || 'border-gray-300'
            }`}
          >
            {outreachStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {!isAddingContact && (
          <button
            type="button"
            onClick={() => setIsAddingContact(true)}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Contact
          </button>
        )}
      </div>

      {/* Add contact form */}
      {isAddingContact && (
        <AddContactForm onAdd={handleAddContact} onCancel={() => setIsAddingContact(false)} />
      )}

      {/* Contact list - Requirements: 5.1 */}
      {contacts.length > 0 ? (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onUpdateStatus={(status) => handleContactStatusUpdate(contact.id, status)}
              onRemove={() => onRemoveContact(contact.id)}
            />
          ))}
        </div>
      ) : (
        !isAddingContact && (
          <p className="text-sm text-gray-500 text-center py-4">
            No referral contacts yet. Add someone who might help with this application.
          </p>
        )
      )}
    </div>
  );
}

export default ReferralContacts;
