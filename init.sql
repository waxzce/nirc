-- Table: message

-- DROP TABLE message;

CREATE TABLE message
(
  id serial NOT NULL,
  chan_name character varying(80),
  username character varying(80),
  mdate timestamp without time zone,
  content text,
  CONSTRAINT message_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);

