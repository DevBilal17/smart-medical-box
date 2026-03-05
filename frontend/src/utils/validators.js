import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

// Register Schema
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    role: z.enum(['patient', 'doctor']),
    phone: z
      .string()
      .min(1, 'Phone number is required')
      .regex(/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'),
    age: z
      .string()
      .min(1, 'Age is required')
      .refine((val) => !isNaN(Number(val)) && Number(val) > 0 && Number(val) < 150, {
        message: 'Please enter a valid age',
      }),
    gender: z.enum(['male', 'female', 'other']),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });





export const patientSchema = z.object({
  name: z.string().min(3, "Name required"),

  email: z.string().email("Invalid email"),

  phone: z.string().min(10, "Phone required"),

  age: z.string().min(1, "Age required"),

  gender: z.enum(["male", "female", "other"]),

  bloodGroup: z.enum([
    "A+","A-","B+","B-","AB+","AB-","O+","O-"
  ]),

  allergies: z.array(z.string()).optional(),

  medicalConditions: z.array(z.string()).optional(),

  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }).optional(),

  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string(),
  }).optional(),
});