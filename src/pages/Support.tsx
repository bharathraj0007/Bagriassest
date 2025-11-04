import { useState } from 'react';
import { MessageCircle, Send, Phone, Mail, MapPin, HelpCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface SupportProps {
  onNavigate: (page: string) => void;
}

export default function Support({ onNavigate }: SupportProps) {
  const { user } = useAuth();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please sign in to submit a support ticket');
      onNavigate('auth');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        subject,
        message,
        priority,
        status: 'open',
      });

      if (error) throw error;

      setSubmitted(true);
      setSubject('');
      setMessage('');
      setPriority('medium');

      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error('Error submitting ticket:', error);
      alert('Error submitting support ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      question: 'How accurate are the crop recommendations?',
      answer:
        'Our recommendations use advanced ML models trained on extensive agricultural data, achieving over 95% accuracy in most conditions.',
    },
    {
      question: 'How often are price predictions updated?',
      answer:
        'Price predictions are updated daily based on real-time market data and historical trends.',
    },
    {
      question: 'Is my farm data secure?',
      answer:
        'Yes, we use industry-standard encryption and security measures to protect all your data.',
    },
    {
      question: 'Can I access the platform on mobile devices?',
      answer:
        'Yes, our platform is fully responsive and works seamlessly on all devices including smartphones and tablets.',
    },
    {
      question: 'How do I apply for government schemes?',
      answer:
        'Visit the Government Schemes page, select a scheme, and click on the application link to be directed to the official portal.',
    },
  ];

  const contactMethods = [
    {
      icon: Phone,
      title: 'Phone Support',
      detail: '+91-1800-XXX-XXXX',
      description: 'Mon-Sat, 9 AM - 6 PM IST',
    },
    {
      icon: Mail,
      title: 'Email Support',
      detail: 'support@agrismart.com',
      description: 'Response within 24 hours',
    },
    {
      icon: MapPin,
      title: 'Office Location',
      detail: 'New Delhi, India',
      description: 'Visit by appointment only',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <MessageCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Support Center</h1>
          <p className="text-xl text-gray-600">
            We're here to help you with any questions or concerns
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit a Support Ticket</h2>

            {submitted && (
              <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
                Your support ticket has been submitted successfully! We'll get back to you soon.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Describe your issue in detail..."
                />
              </div>

              <button
                type="submit"
                disabled={loading || !user}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
                <span>{loading ? 'Submitting...' : 'Submit Ticket'}</span>
              </button>

              {!user && (
                <p className="text-sm text-center text-gray-600">
                  Please{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('auth')}
                    className="text-green-600 hover:text-green-700 font-semibold"
                  >
                    sign in
                  </button>{' '}
                  to submit a support ticket
                </p>
              )}
            </form>
          </div>

          <div>
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
              <div className="space-y-6">
                {contactMethods.map((method, index) => {
                  const Icon = method.icon;
                  return (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                        <Icon className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{method.title}</h3>
                        <p className="text-green-600 font-medium">{method.detail}</p>
                        <p className="text-sm text-gray-600">{method.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl shadow-xl p-8 text-white">
              <h3 className="text-xl font-bold mb-3">Need Immediate Help?</h3>
              <p className="text-green-50 mb-4">
                For urgent issues, please call our support hotline. We're available Monday to
                Saturday, 9 AM to 6 PM IST.
              </p>
              <button className="px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition">
                Call Now
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-3 mb-6">
            <HelpCircle className="h-8 w-8 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}