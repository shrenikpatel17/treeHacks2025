'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from "next/navigation";

const GetStarted: React.FC = () => {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [npi, setNpi] = useState('');


  const handleSubmit = async () => {
    if (firstName === '' || lastName === '' || email === '' || password === '' || npi === '') {
        return;
    }
    
    try {
        const res = await fetch("api/signup", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            npi: npi
        }),
        });

        if (res.ok) {
          router.push("/login");
          console.log(res)
        } else {
          console.log("User registration failed.");
        }
    } catch (error) {
        console.log("Error during registration: ", error);
    }
    };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-transparent border-transparent rounded-3xl p-8 sm:p-10 lg:p-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          {/* <Image src={logo} alt="Your Company Logo" className="mx-auto h-8 w-auto" /> */}
          <h2 className="mt-5 text-lg font-RalewayRegular leading-9 text-theme-blue">
            Get started with your account
          </h2>
        </div>

        <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md">
          <form className="space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-RalewayRegular leading-6 text-theme-blue">
                First Name
              </label>
              <div className="mt-2">
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="p-2 bg-transparent font-RalewayMedium block w-full rounded-2xl border-0 py-1.5 text-theme-blue shadow-sm ring-1 ring-inset ring-theme-blue placeholder:text-light-gray sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-RalewayRegular leading-6 text-theme-blue">
                Last Name
              </label>
              <div className="mt-2">
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="p-2 bg-transparent font-RalewayMedium block w-full rounded-2xl border-0 py-1.5 text-theme-blue shadow-sm ring-1 ring-inset ring-theme-blue placeholder:text-light-gray sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-RalewayRegular leading-6 text-theme-blue">
                Email
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="p-2 bg-transparent font-RalewayMedium block w-full rounded-2xl border-0 py-1.5 text-theme-blue shadow-sm ring-1 ring-inset ring-theme-blue placeholder:text-light-gray sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-RalewayRegular leading-6 text-theme-blue">
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="p-2 bg-transparent block w-full rounded-2xl border-0 py-1.5 text-theme-blue shadow-sm ring-1 ring-inset ring-theme-blue placeholder:text-gray-400 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="npi" className="block text-sm font-RalewayRegular leading-6 text-theme-blue">
                NPI
              </label>
              <div className="mt-2">
                <input
                  id="npi"
                  name="npi"
                  type="npi"
                  autoComplete="current-password"
                  required
                  value={npi}
                  onChange={(e) => setNpi(e.target.value)}
                  className="p-2 bg-transparent block w-full rounded-2xl border-0 py-1.5 text-theme-blue shadow-sm ring-1 ring-inset ring-theme-blue placeholder:text-gray-400 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <a
                onClick={handleSubmit}
                className="flex w-full justify-center rounded-2xl bg-theme-blue px-3 py-1.5 text-sm font-RalewayMedium leading-6 text-white shadow-sm hover:bg-hover-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Sign up
              </a>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-theme-blue font-RalewayMedium">
            Already have an account?{' '}
            <a href="/login" className="font-RalewayBold leading-6 text-theme-blue hover:text-hover-blue">
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default GetStarted;
