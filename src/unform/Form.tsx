import dot from "dot-object";
import React, { FormEvent, useState } from "react";
import { ObjectSchema, ValidationError } from "yup";

import FormContext from "./Context";
import { Field, Errors } from "./types";

interface Context {
  [key: string]: any;
}

interface Props {
  initialData: object;
  children: React.ReactNode;
  context: Context;
  validationSchema?: ObjectSchema<object>;
}

export default function Form({
  initialData,
  children,
  validationSchema,
  context
}: Props) {
  const [errors, setErrors] = useState<Errors>({});

  let refs: Field[] = [];

  function parseFormData() {
    const data = {};

    refs.forEach(({ name, ref, path }) => {
      data[name] = dot.pick(path, typeof ref === "function" ? ref() : ref);
    });

    return dot.object(data);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const data = parseFormData();

    try {
      console.log(refs);

      if (validationSchema) {
        await validationSchema.validate(data, {
          abortEarly: false,
          context
        });
      }

      console.log("ok");
    } catch (err) {
      const validationErrors: Errors = {};

      err.inner.forEach((error: ValidationError) => {
        validationErrors[error.path] = error.message;
      });

      setErrors(validationErrors);
    }
  }

  function registerField(field: Field) {
    refs.push(field);
  }

  function unregisterField(name: string) {
    refs = refs.filter(ref => ref.name !== name);
  }

  return (
    <FormContext.Provider
      value={{
        initialData,
        errors,
        scopePath: "",
        registerField,
        unregisterField
      }}
    >
      <form onSubmit={handleSubmit}>{children}</form>
    </FormContext.Provider>
  );
}