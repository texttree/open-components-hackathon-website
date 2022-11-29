/**
 * Copyright 2020 Vercel Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useState } from 'react';
import cn from 'classnames';
import LoadingDots from './loading-dots';
import styles from './custom-form.module.css';

type FormState = 'default' | 'loading' | 'error';

import {
  useShortAnswerInput,
  useLongAnswerInput,
  useDropdownInput,
  useRadioInput,
  useGoogleForm,
  GoogleFormProvider
} from 'react-google-forms-hooks';

import form from 'GoogleForm.json';
import Select from './select';

const ShortAnswerInput = ({ id }: { id: string }) => {
  const { register, label, required, description } = useShortAnswerInput(id);

  return (
    <>
      <label>
        <div>{label}</div>
        <div>{description}</div>
        <input
          className="p-4 w-80 text-md bg-gray-600 rounded-lg placeholder:text-gray-400 focus:outline-none focus:bg-gray-700"
          type={label.toLocaleLowerCase() === 'email' ? 'email' : 'text'}
          {...register()}
          required={required}
        />
      </label>
    </>
  );
};

const LongAnswerInput = ({ id }: { id: string }) => {
  const { register, label, required, description } = useLongAnswerInput(id);

  return (
    <>
      <label>
        <div>{label}</div>
        <div>{description}</div>
        <textarea
          className="p-4 text-white border-0 w-80 text-md bg-gray-600 rounded-lg placeholder:text-gray-400 focus:outline-none focus:bg-gray-700"
          {...register()}
          required={required}
        />
      </label>
    </>
  );
};

const RadioInput = ({ id }: { id: string }) => {
  const { options, customOption, error, label, description, required } = useRadioInput(id);

  return (
    <>
      <div>{label}</div>
      <div>{description}</div>
      {options.map(o => (
        <div key={o.id}>
          <input type="radio" id={o.id} {...o.registerOption()} required={required} />
          <label htmlFor={o.id}>{o.label}</label>
        </div>
      ))}
      {customOption && (
        <div>
          <input type="radio" id={customOption.id} {...customOption.registerOption()} />
          <label htmlFor={customOption.id}>Your option</label>
          <input
            className="p-4 block border-0 w-80 text-md bg-gray-600 rounded-lg placeholder:text-gray-400 focus:outline-none focus:bg-gray-700"
            type="text"
            {...customOption.registerCustomInput()}
          />
        </div>
      )}
      <div>{error && 'This field is required'}</div>
    </>
  );
};

const DropdownInput = ({ id }: { id: string }) => {
  const { register, options, required, label, description } = useDropdownInput(id);

  return (
    <>
      <label>{label}</label>
      <div>{description}</div>
      <Select
        {...register()}
        required={required}
      >
        {options.map(o => {
          return (
            <option key={o.label} value={o.label}>
              {o.label}
            </option>
          );
        })}
      </Select>
    </>
  );
};

const Contactform = () => {
  // @ts-ignore
  const methods = useGoogleForm({ form });

  const [formState, setFormState] = useState<FormState>('default');

  const onSubmit = async (data: any) => {
    setFormState('loading')
    console.log('>>> Here is the data', data);
    await methods.submitToGoogleForms(data);
    setFormState('default')
    alert('Form submitted with success!');
  };

  return (
    <>
      <GoogleFormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)}>
          <Questions />
          <button
            type="submit"
            className={cn(styles.submit, styles.register, styles[formState])}
            disabled={formState === 'loading'}
          >
            {formState === 'loading' ? <LoadingDots size={4} /> : <>Submit</>}
          </button>
        </form>
      </GoogleFormProvider>
    </>
  );
};

export { Contactform };

const Questions = () => {
  return (
    <div>
      {form.fields.map(field => {
        const { id } = field;

        let questionInput = null;
        switch (field.type) {
          case 'RADIO':
            questionInput = <RadioInput id={id} />;
            break;
          case 'SHORT_ANSWER':
            questionInput = <ShortAnswerInput id={id} />;
            break;
          case 'LONG_ANSWER':
            questionInput = <LongAnswerInput id={id} />;
            break;
          case 'DROPDOWN':
            questionInput = <DropdownInput id={id} />;
            break;
        }

        if (!questionInput) {
          return null;
        }

        return <div key={id} className='my-6'>{questionInput}</div>;
      })}
    </div>
  );
};
