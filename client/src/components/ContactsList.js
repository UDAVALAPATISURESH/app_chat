import React from 'react';
import './ContactsList.css';

const ContactsList = ({ contacts, groups, selectedContact, selectedGroup, onSelectContact, onSelectGroup }) => {
  return (
    <div className="contacts-list">
      {/* Groups Section */}
      {groups && groups.length > 0 && (
        <>
          <div className="contacts-header">
            <h3>Groups</h3>
          </div>
          <div className="contacts-scroll">
            {groups.map((group) => (
              <div
                key={group.id || group._id}
                className={`contact-item group-item ${(selectedGroup?.id || selectedGroup?._id) === (group.id || group._id) ? 'active' : ''}`}
                onClick={() => onSelectGroup && onSelectGroup(group)}
              >
                <div className="contact-avatar group-avatar">
                  {group.name?.charAt(0).toUpperCase() || 'G'}
                </div>
                <div className="contact-info">
                  <h4>{group.name}</h4>
                  <p>{group.members?.length || 0} members</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Contacts Section */}
      <div className="contacts-header">
        <h3>Contacts</h3>
      </div>
      <div className="contacts-scroll">
        {contacts.length === 0 ? (
          <div className="no-contacts">No contacts available</div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id || contact._id}
              className={`contact-item ${(selectedContact?.id || selectedContact?._id) === (contact.id || contact._id) ? 'active' : ''}`}
              onClick={() => onSelectContact(contact)}
            >
              <div className="contact-avatar">
                {contact.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="contact-info">
                <h4>{contact.name}</h4>
                <p>{contact.email}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContactsList;
