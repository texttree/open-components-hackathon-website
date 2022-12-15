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
import selectStyles from './select.module.css';

import {
  useShortAnswerInput,
  useLongAnswerInput,
  useDropdownInput,
  useRadioInput,
  useGoogleForm,
  GoogleFormProvider
} from 'react-google-forms-hooks';

import { confirm } from '@lib/user-api';
import form from 'GoogleForm.json';
import useConfData from '@lib/hooks/use-conf-data';

type FormState = 'default' | 'loading' | 'error';

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
    <div className="w-80">
      <label>{label}</label>
      <div>{description}</div>
      <div className={selectStyles.container}>
        <select className={cn(selectStyles.select)} {...register()} required={required}>
          {options.map(o => {
            return (
              <option key={o.label} value={o.label}>
                {o.label}
              </option>
            );
          })}
        </select>
        <div className={selectStyles.arrow}>
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            shapeRendering="geometricPrecision"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const getEmailId = () => {
  return form.fields.filter(res => res.label.toLocaleLowerCase() === 'email')[0].id
}

const Contactform = () => {
  // @ts-ignore
  const methods = useGoogleForm({ form });

  const { setPageState, setUserData, userData } = useConfData();

  const [formState, setFormState] = useState<FormState>('default');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const onSubmit = async (data: any) => {
    setErrorMsg('');
    setFormState('loading');
    await methods.submitToGoogleForms(data);

    confirm(data[getEmailId()])
      .then(async res => {
        if (!res.ok) {
          throw new Error();
        }
        setUserData({ ...userData, form: true });
        setPageState('ticket');
        setFormState('default');
      })
      .catch(async err => {
        let message = 'Error! Please try again.';
        setFormState('error');
        setErrorMsg(err?.message ?? message);
      });
  };

  return (
    <div className={cn(styles.wrapForm)}>
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
          {formState === 'error' ? <p style={{color: 'red'}}>{errorMsg}</p> : '' }
        </form>
      </GoogleFormProvider>
    </div>
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

        return (
          <div key={id} className="my-6">
            {questionInput}
          </div>
        );
      })}
    </div>
  );
};
