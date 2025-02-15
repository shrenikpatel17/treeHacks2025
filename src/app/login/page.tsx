'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { authActions } from '../state/reducers/authSlice';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from "next/navigation";


const SignIn: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async(e: React.ChangeEvent<any>) => {
    e.preventDefault();

    if (!e.target.email.value || !e.target.password.value) {
      return "All fields are required";
    }
    const loggedInResponse = await fetch("api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        {
        email: e.target.email.value,
        password: e.target.password.value,
      }),
    });
    const loggedIn = await loggedInResponse.json();
    console.log(loggedIn);
    if (loggedIn.token) {
      dispatch(
        authActions.setLogin({
          user: loggedIn.user,
          token: loggedIn.token,
        })
      );
      e.target.reset();
      router.push("/dashboard");
    }
    else{
      console.log(loggedIn.msg);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-transaprent border-transparent rounded-3xl p-8 sm:p-10 lg:p-12">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          {/* <Image src={logo} alt="Your Company Logo" className="mx-auto h-8 w-auto" /> */}
          <h2 className="mt-5 text-lg font-RalewayRegular leading-9 text-theme-blue">
            Sign in to your account
          </h2>
        </div>

        <div className="mt-5 sm:mx-auto sm:w-full sm:max-w-md">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-RalewayRegular leading-6 text-theme-blue">
                  Password
                </label>
                <div className="text-sm">
                  <a className="font-RalewayMedium text-theme-blue hover:text-theme-blue">
                    Forgot password?
                  </a>
                </div>
              </div>
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
              <button
                type="submit"
                className="flex w-full justify-center rounded-2xl bg-black px-3 py-1.5 text-sm font-RalewayMedium leading-6 text-white shadow-sm hover:bg-hover-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Sign in
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-sm text-theme-blue font-RalewayMedium">
            Don&apos;t have an account?{' '}
            <a href="/signup" className="font-RalewayBold leading-6 theme-blue hover:text-hover-blue">
              Get Started
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
