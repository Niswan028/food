import { Link } from 'react-router-dom';
import { Leaf, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-earth-200 bg-earth-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
                <Leaf className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-bold text-earth-950">FarmTrace</span>
            </div>
            <p className="mt-3 text-sm text-earth-600">
              Direct farm-to-retail traceability platform. Know exactly where your food comes from, verified on blockchain.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-earth-900">Platform</h4>
            <ul className="space-y-2 text-sm text-earth-600">
              <li><Link to="/marketplace" className="hover:text-primary-600">Marketplace</Link></li>
              <li><Link to="/signup" className="hover:text-primary-600">For Farmers</Link></li>
              <li><Link to="/signup" className="hover:text-primary-600">For Buyers</Link></li>
              <li><Link to="/" className="hover:text-primary-600">How It Works</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-earth-900">Resources</h4>
            <ul className="space-y-2 text-sm text-earth-600">
              <li><Link to="/" className="hover:text-primary-600">About Us</Link></li>
              <li><Link to="/" className="hover:text-primary-600">Certifications</Link></li>
              <li><Link to="/" className="hover:text-primary-600">Blockchain Verification</Link></li>
              <li><Link to="/" className="hover:text-primary-600">Support</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-earth-900">Contact</h4>
            <ul className="space-y-2 text-sm text-earth-600">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> hello@farmtrace.in</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +91 98200 11234</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Bengaluru, India</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-earth-200 pt-6 text-center text-sm text-earth-500">
          <p>&copy; {new Date().getFullYear()} FarmTrace. All rights reserved. Built for Indian agriculture.</p>
        </div>
      </div>
    </footer>
  );
}
