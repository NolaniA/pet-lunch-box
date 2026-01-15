"use client"

import { Form, Input, Button, User } from "@heroui/react";
import { useState } from "react";

export const InputField = ({ name }: { name: string }) => {
  return (
    <div><Input
      isRequired
      label={name}
      labelPlacement="outside"
      name={name} placeholder="number"
      type="number"
      classNames={{ base: 'h-20' }}
    /></div>
  )
}



export default function FormInput() {
  const [errors, setErrors] = useState({});
  const totalTimeLoop = [1, 2, 3]

  const onSubmit = (e: any) => {
    e.preventDefault();

    const data = Object.fromEntries(new FormData(e.currentTarget));
    console.log(data)

    const result = callServer(data);

    // if (!data.length) {
    //   setErrors(result.errors);
    // }

    // setErrors(result.errors)
  };

  return (
    <Form
      className="w-full flex mx-auto container justify-center items-center flex-col gap-3"
      validationErrors={errors}
      onSubmit={onSubmit}

    >
      {totalTimeLoop.map((index) => <div key={index} className="flex gap-5 items-center">
        <span>time {index}</span>
        <InputField name="hour" />
        <InputField name="minute" />
        <InputField name="duration_sec" /></div>)}

      <Button type="submit" variant="flat">
        Submit
      </Button>
    </Form>
  );
}

// Fake server used in this example.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function callServer(data: any) {
  return {
    errors: {
      hour: "please input",
      minute: "please input",
      duration_sec: "please input"
    },
  };
}

