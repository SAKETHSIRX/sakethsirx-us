"use client";

import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "./button";
import { cn } from "../../lib/utils";
import { CreditCard, Mail, Smartphone, Plus, Tag } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
}

interface PaymentMethod {
  id: string;
  type: string;
  last4?: string;
  brand?: string;
}

const plans: Plan[] = [
  { id: "short-edit", name: "Short Edit", price: 99, interval: "project" },
  { id: "full-length-video", name: "Full-length Video", price: 499, interval: "video" },
  { id: "combo-pack", name: "Combo Pack", price: 549, interval: "bundle" },
];

const savedPaymentMethods: PaymentMethod[] = [
  { id: "card1", type: "card", last4: "4242", brand: "Visa" },
  { id: "card2", type: "card", last4: "8888", brand: "Mastercard" },
];

export function SubscriptionCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const planParam = searchParams.get('plan');

  // Find the plan based on URL parameter, default to combo-pack (most popular)
  const defaultPlan = plans.find(p => p.id === planParam) || plans[2]; // combo-pack is index 2

  const [selectedPlan, setSelectedPlan] = React.useState<Plan>(defaultPlan);
  const [email, setEmail] = React.useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<string>("card1");
  const [paymentType, setPaymentType] = React.useState<"card" | "upi">("card");
  const [promoCode, setPromoCode] = React.useState("");
  const [promoApplied, setPromoApplied] = React.useState(false);
  const [discount, setDiscount] = React.useState(0);

  const subtotal = selectedPlan.price;
  const total = subtotal - discount;

  const handleGoBack = () => {
    navigate('/');
  };

  const handleApplyPromo = () => {
    if (promoCode.toLowerCase() === "save20") {
      setDiscount(subtotal * 0.2);
      setPromoApplied(true);
    } else {
      setDiscount(0);
      setPromoApplied(false);
    }
  };

  const handleSubscribe = () => {
    // Handle subscription logic here
    console.log("Subscribing with:", { selectedPlan, email, selectedPaymentMethod, paymentType, total });
  };

  return (

    <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? "bg-black text-white" : "bg-gray-50 text-black"}`}>
      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Back Button */}
      <button
        onClick={handleGoBack}
        className={`absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 backdrop-blur-sm border ${
          isDarkMode 
            ? "bg-white/10 hover:bg-white/20 border-white/20 text-white hover:border-white/30" 
            : "bg-black/10 hover:bg-black/20 border-black/20 text-black hover:border-black/30"
        }`}
      >
        <ArrowLeft size={18} />
        Back to <span className="text-red-500">Home</span> 
      </button>
        
        
        {/* Left Side - Plan Details */}
        <div className="order-2 lg:order-1">
          <div className={`rounded-2xl shadow-lg p-8 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
            <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Order Summary</h2>
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Choose Your Plan</h3>
              <div className="space-y-3">
                {plans.map((plan) => (
                  <label
                    key={plan.id}
                    className={cn(
                      "flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all",
                      selectedPlan.id === plan.id
                        ? `border-blue-500 ${isDarkMode ? "bg-blue-900" : "bg-blue-50"}`
                        : `border-gray-200 hover:border-gray-300 ${isDarkMode ? "border-gray-600" : "border-gray-200"}`
                    )}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={plan.id}
                      checked={selectedPlan.id === plan.id}
                      onChange={() => setSelectedPlan(plan)}
                      className="sr-only"
                    />
                    <div>
                      <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{plan.name}</span>
                      <span className={`ml-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>₹{plan.price}/{plan.interval}</span>
                    </div>
                    <div className={cn(
                      "w-4 h-4 border-2 rounded-full flex items-center justify-center",
                      selectedPlan.id === plan.id ? "border-blue-500" : `${isDarkMode ? "border-gray-500" : "border-gray-300"}`
                    )}>
                      {selectedPlan.id === plan.id && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className={`flex justify-between items-center py-10 border-b ${isDarkMode ? "border-gray-600" : "border-gray-200"}`}>
                <div>
                  <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{selectedPlan.name}</h3>
                  <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Billed {selectedPlan.interval}ly</p>
                </div>
                <span className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>₹{selectedPlan.price}</span>
              </div>
              {/* Promotion Code */}
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Promotion Code</h3>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter promo code"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-black"}`}
                  />
                </div>
                <Button
                  onClick={handleApplyPromo}
                  variant="outline"
                  className="px-10 mt-2 "
                >
                  Apply
                </Button>
              </div>
              {promoApplied && (
                <p className="text-green-600 text-sm mt-2">Promotion code applied successfully!</p>
              )}
            </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>

              {promoApplied && (
                <div className="flex justify-between items-center py-2 text-green-600">
                  <span>Discount (20%)</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center py-4 border-t border-gray-200 pt-4">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-2xl font-bold text-gray-900">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Payment Form */}
        <div className="order-1 lg:order-2">
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Subscribe</h1>

            {/* Plan Selection */}
            

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>

              {/* Payment Type Tabs */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setPaymentType("card")}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                    paymentType === "card"
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <CreditCard className="w-4 h-4 inline mr-2" />
                  Card
                </button>
                <button
                  onClick={() => setPaymentType("upi")}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                    paymentType === "upi"
                      ? "bg-blue-100 text-blue-700 border border-blue-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  )}
                >
                  <Smartphone className="w-4 h-4 inline mr-2" />
                  UPI
                </button>
              </div>

              {paymentType === "card" ? (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Saved Payment Methods</h4>
                  {savedPaymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={cn(
                        "flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all",
                        selectedPaymentMethod === method.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={selectedPaymentMethod === method.id}
                        onChange={() => setSelectedPaymentMethod(method.id)}
                        className="sr-only"
                      />
                      <div className="flex items-center">
                        <CreditCard className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="font-medium">
                          {method.brand} **** {method.last4}
                        </span>
                      </div>
                      <div className={cn(
                        "w-4 h-4 border-2 rounded-full flex items-center justify-center",
                        selectedPaymentMethod === method.id ? "border-blue-500" : "border-gray-300"
                      )}>
                        {selectedPaymentMethod === method.id && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </label>
                  ))}

                  <button className="flex items-center justify-center w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 transition-colors">
                    <Plus className="w-5 h-5 mr-2" />
                    Add New Payment Method
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                 <h2 className="mt-4 text-lg font-semibold">UPI ID</h2> 
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Enter UPI ID (ex:XXX@oksbi)"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <h2 className="mt-4 text-lg font-semibold">Scan QR Code</h2>                
                  <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto flex items-center justify-center mt-4">
                    <span className="text-gray-500 text-sm">QR Code</span>
                  </div>
                </div>
              )}
            </div>

            

            {/* Subscribe Button */}
            <Button
              onClick={handleSubscribe}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-4 text-lg font-semibold rounded-lg"
            >
              Subscribe for ₹{total.toFixed(2)}/{selectedPlan.interval}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}