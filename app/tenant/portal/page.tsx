'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Home, 
  CreditCard, 
  Calendar, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Phone,
  MessageCircle,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PaymentModal } from '@/components/PaymentModal'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Rental {
  id: string
  property: {
    id: string
    title: string
    address: string
    images: string[]
  }
  monthlyRent: number
  deposit: number
  leaseStart: string
  leaseEnd: string
  status: 'active' | 'terminated' | 'pending_termination'
}

interface Bill {
  id: string
  type: 'rent' | 'utilities' | 'maintenance' | 'deposit'
  amount: number
  dueDate: string
  status: 'pending' | 'paid' | 'overdue'
  description: string
  property_id: string
}

interface Payment {
  id: string
  bill_id: string
  amount: number
  method: 'mpesa' | 'stripe'
  status: 'completed' | 'pending' | 'failed'
  transaction_id: string
  created_at: string
}

export default function TenantPortal() {
  const [rentals, setRentals] = useState<Rental[]>([])
  const [bills, setBills] = useState<Bill[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'mpesa' | 'stripe'>('mpesa')
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean
    billId: string
    amount: number
    description: string
  }>({
    isOpen: false,
    billId: '',
    amount: 0,
    description: ''
  })

  // Mock data
  const mockRental: Rental = {
    id: '1',
    property: {
      id: '1',
      title: 'Modern 2BR Apartment',
      address: 'Westlands, Nairobi',
      images: ['/api/placeholder/400/300']
    },
    monthlyRent: 85000,
    deposit: 170000,
    leaseStart: '2024-01-01',
    leaseEnd: '2024-12-31',
    status: 'active'
  }

  const mockBills: Bill[] = [
    {
      id: '1',
      type: 'rent',
      amount: 85000,
      dueDate: '2024-02-01',
      status: 'pending',
      description: 'Monthly rent for February 2024',
      property_id: '1'
    },
    {
      id: '2',
      type: 'utilities',
      amount: 12500,
      dueDate: '2024-02-05',
      status: 'pending',
      description: 'Electricity and water for January 2024',
      property_id: '1'
    },
    {
      id: '3',
      type: 'rent',
      amount: 85000,
      dueDate: '2024-01-01',
      status: 'paid',
      description: 'Monthly rent for January 2024',
      property_id: '1'
    }
  ]

  useEffect(() => {
    setRentals([mockRental])
    setBills(mockBills)
  }, [])

  const handlePaymentSuccess = (paymentData: any) => {
    // Update bill status
    setBills(bills.map(bill => 
      bill.id === paymentModal.billId 
        ? { ...bill, status: 'paid' as const }
        : bill
    ))
    
    // Add payment record
    const newPayment: Payment = {
      id: Date.now().toString(),
      bill_id: paymentModal.billId,
      amount: paymentData.amount,
      method: paymentData.method,
      status: 'completed',
      transaction_id: paymentData.transaction_id,
      created_at: new Date().toISOString()
    }
    
    setPayments([...payments, newPayment])
    toast.success('Payment successful!')
    
    // Close modal
    setPaymentModal({
      isOpen: false,
      billId: '',
      amount: 0,
      description: ''
    })
  }

  const handleTerminationRequest = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setRentals(rentals.map(rental => ({
        ...rental,
        status: 'pending_termination'
      })))
      
      toast.success('Termination request submitted. Your landlord will be notified.')
    } catch (error) {
      toast.error('Failed to submit termination request')
    }
  }

  const getBillStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getBillStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />
      case 'overdue': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-nestie-grey-50">
      {/* Header */}
      <header className="bg-nestie-white border-b border-nestie-grey-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-nestie-black rounded-lg flex items-center justify-center">
                <span className="text-nestie-white font-bold text-sm">N</span>
              </div>
              <span className="text-xl font-bold text-nestie-black">Tenant Portal</span>
            </Link>
            
            <nav className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Messages
              </Button>
              <Button variant="ghost" size="sm">
                Profile
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Rental */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Home className="h-5 w-5 mr-2" />
                    Current Rental
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {rentals.map((rental) => (
                    <div key={rental.id} className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-nestie-black">{rental.property.title}</h3>
                          <p className="text-nestie-grey-600">{rental.property.address}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          rental.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : rental.status === 'pending_termination'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {rental.status.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-nestie-grey-500">Monthly Rent</p>
                          <p className="font-semibold text-nestie-black">KSh {rental.monthlyRent.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-nestie-grey-500">Lease Start</p>
                          <p className="font-semibold text-nestie-black">
                            {new Date(rental.leaseStart).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-nestie-grey-500">Lease End</p>
                          <p className="font-semibold text-nestie-black">
                            {new Date(rental.leaseEnd).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {rental.status === 'active' && (
                        <div className="pt-4 border-t border-nestie-grey-200">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleTerminationRequest}
                          >
                            Request Termination
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>

            {/* Bills & Payments */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Bills & Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bills.map((bill) => (
                      <div key={bill.id} className="border border-nestie-grey-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-nestie-black capitalize">{bill.type}</h4>
                            <p className="text-sm text-nestie-grey-600">{bill.description}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-nestie-black">
                              KSh {bill.amount.toLocaleString()}
                            </p>
                            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBillStatusColor(bill.status)}`}>
                              {getBillStatusIcon(bill.status)}
                              <span className="ml-1 capitalize">{bill.status}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center text-sm text-nestie-grey-600">
                            <Calendar className="h-4 w-4 mr-1" />
                            Due: {new Date(bill.dueDate).toLocaleDateString()}
                          </div>
                          
                          {bill.status === 'pending' && (
                            <Button 
                              size="sm"
                              onClick={() => setPaymentModal({
                                isOpen: true,
                                billId: bill.id,
                                amount: bill.amount,
                                description: bill.description
                              })}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              Pay Now
                            </Button>
                          )}
                          
                          {bill.status === 'paid' && (
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Receipt
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Methods */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPaymentMethod === 'mpesa' 
                          ? 'border-nestie-black bg-nestie-grey-50' 
                          : 'border-nestie-grey-200'
                      }`}
                      onClick={() => setSelectedPaymentMethod('mpesa')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                          <Phone className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-nestie-black">M-Pesa</p>
                          <p className="text-sm text-nestie-grey-500">Mobile money payment</p>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedPaymentMethod === 'stripe' 
                          ? 'border-nestie-black bg-nestie-grey-50' 
                          : 'border-nestie-grey-200'
                      }`}
                      onClick={() => setSelectedPaymentMethod('stripe')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-nestie-black">Credit Card</p>
                          <p className="text-sm text-nestie-grey-500">Visa, Mastercard</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Payment Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-nestie-grey-600">Pending Bills</span>
                      <span className="font-semibold text-nestie-black">
                        {bills.filter(b => b.status === 'pending').length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-nestie-grey-600">Total Due</span>
                      <span className="font-semibold text-nestie-black">
                        KSh {bills
                          .filter(b => b.status === 'pending')
                          .reduce((sum, b) => sum + b.amount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-nestie-grey-600">Paid This Month</span>
                      <span className="font-semibold text-green-600">
                        KSh {bills
                          .filter(b => b.status === 'paid')
                          .reduce((sum, b) => sum + b.amount, 0)
                          .toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Landlord
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Download Lease
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Payment History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModal.isOpen}
        onClose={() => setPaymentModal({
          isOpen: false,
          billId: '',
          amount: 0,
          description: ''
        })}
        amount={paymentModal.amount}
        description={paymentModal.description}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}