/**
 * Contact Management Service for LinkedIn Job Application Tracker
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import type { ReferralContact, ReferralStatus, JobPosting } from '../types';

/**
 * Input for adding a new contact (without id and default status)
 */
export interface AddContactInput {
  name: string;
  contactMethod: string;
  dateContacted?: string | null;
}

/**
 * Generates a unique ID for a contact
 */
function generateContactId(): string {
  return crypto.randomUUID();
}

/**
 * Add a new referral contact to a job posting
 * Requirements: 5.1, 5.2, 5.3 - Add contact with default "Not Contacted" status
 * 
 * @param job - The job posting to add the contact to
 * @param contactInput - The contact information (name, contactMethod, optional dateContacted)
 * @returns Updated job posting with the new contact added
 */
export function addContact(
  job: JobPosting,
  contactInput: AddContactInput
): JobPosting {
  const newContact: ReferralContact = {
    id: generateContactId(),
    name: contactInput.name,
    contactMethod: contactInput.contactMethod,
    dateContacted: contactInput.dateContacted ?? null,
    status: 'Not Contacted', // Requirements: 5.3 - default status
  };

  return {
    ...job,
    referralContacts: [...job.referralContacts, newContact],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Update the status of a referral contact
 * Requirements: 5.4, 5.5 - Update contact status and persist immediately
 * 
 * @param job - The job posting containing the contact
 * @param contactId - The ID of the contact to update
 * @param newStatus - The new referral status
 * @returns Updated job posting with the contact status changed, or original if contact not found
 */
export function updateContactStatus(
  job: JobPosting,
  contactId: string,
  newStatus: ReferralStatus
): JobPosting {
  const contactIndex = job.referralContacts.findIndex(c => c.id === contactId);
  
  if (contactIndex === -1) {
    return job; // Contact not found, return unchanged
  }

  const updatedContacts = [...job.referralContacts];
  updatedContacts[contactIndex] = {
    ...updatedContacts[contactIndex],
    status: newStatus,
    // If status is being changed to "Contacted" and no date was set, set it now
    dateContacted: newStatus === 'Contacted' && !updatedContacts[contactIndex].dateContacted
      ? new Date().toISOString()
      : updatedContacts[contactIndex].dateContacted,
  };

  return {
    ...job,
    referralContacts: updatedContacts,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Remove a referral contact from a job posting
 * Requirements: 5.1 - Manage multiple contacts (includes removal)
 * 
 * @param job - The job posting containing the contact
 * @param contactId - The ID of the contact to remove
 * @returns Updated job posting with the contact removed
 */
export function removeContact(
  job: JobPosting,
  contactId: string
): JobPosting {
  return {
    ...job,
    referralContacts: job.referralContacts.filter(c => c.id !== contactId),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Get a specific contact from a job posting
 * 
 * @param job - The job posting containing the contact
 * @param contactId - The ID of the contact to find
 * @returns The contact if found, null otherwise
 */
export function getContact(
  job: JobPosting,
  contactId: string
): ReferralContact | null {
  return job.referralContacts.find(c => c.id === contactId) ?? null;
}

export const ContactService = {
  addContact,
  updateContactStatus,
  removeContact,
  getContact,
};

export default ContactService;
