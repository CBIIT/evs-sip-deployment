module.exports = function (protocol, host, basePath) {
    return {
      'swagger': '2.0',
      'info': {
        'version': '1.0.0',
        'title': 'EVSSIP Restful API'
      },
      'host': host,
      'basePath': basePath,
      'tags': [
        {
          'name': 'Search',
          'description': 'Rest APIs provide flexibilities for searching data using hierarchical patterns.'
        },
        {
            'name': 'Retrieve Dataset',
            'description': 'Rest APIs are used to retrieve data per dataset source.'
          },      
      ],
      'schemes': [
        protocol
      ],
      'consumes': [
        'application/json'
      ],
      'produces': [
        'application/json', 'application/xml'
      ],
      'paths': {
        '/search': {
          'get': {
            'tags': ['Search'],
            'summary': 'Search data with specified keywords and additional conditions. The syntax needed to perform api calls is described below. API calls can be tested interactively using the embedded interface before accessing the api programmatically. Output is returned in JSON format except when specifically indicated. ',
            'description': ' Query Patterns is: ' + protocol + '://' + host + basePath + '**/search?keyword={keywords}&options={partial,syn,desc}&sources={ctdc,gdc,icdc,pcdc}&format={json,xml}**. \n'+ 
              '# Keyword\n' +
              'The **keyword** parameter is required to specify the term or phrase to be searched.\n' +
              '# Options\n' +
              'The **options** parameter is used to perform a custom search.\n' +
              'Valid entries for options specifications are: **partial** or **exact**, **syn**, **desc**. \n' +
              '\n' +
              'The **partial** is **default** search option, It is not necessary to specify it \n' +
              'The **exact** is used to perform exact search for term or phrase specified in keyword. \n' +
              'The **syn** is used to perform search in synonyms for term or phrase specified in keyword. \n' +
              'The **desc** is used to perform search in property description for term or phrase specified in keyword. \n' +
              '\n' +
              '# Sources\n' +
              'The **sources** parameter is specify one or more data sources to perform a custom search.\n' +
              'Valid entries for options specifications are: **ctdc** or **gdc**, **icdc**, **pcddc**. \n' +
              '\n' +
              '# Format\n' +
              'The **format** parameter is specify the result data format. \n' +
              'The **json** format is the default one and could be omitted. Valid entries for data format are: **json** or **xml**. \n' +
              '\n' +
              '| Example | URL |\n' +
              '|---|---|\n' +
              '| **keyword** only | |\n' +
              '| - perform partial search in enums, ICDO-3 code, NCIt code and property name <br> return data that partially matches **melanoma**. | [search?keyword=melanoma](' + protocol + '://' + host + basePath + '/search?keyword=melanoma)|\n' +
              '| - perform partial search in enums, ICDO-3 code, NCIt code and property name <br> return data associated with ICDO-3 code **8000/6**. | [search?keyword=8000/6](' + protocol + '://' + host + basePath + '/search?keyword=8000/6)|\n' +
              '| - perform partial search in enums, ICDO-3 code, NCIt code and property name <br> return data associated with NCIt concept code **C12434**. | [search?keyword=c12434](' + protocol + '://' + host + basePath + '/search?keyword=c12434)|\n' +
              '| - perform partial search in enums, ICDO-3 code, NCIt code and property name <br> return data that partially matches **primary_diagnosis**. | [search?keyword=primary_diagnosis](' + protocol + '://' + host + basePath + '/search?keyword=primary_diagnosis)|\n' +
              '| | |\n' +
              '| **keyword & options** | |\n' +
              '| - perform partial search in enums, ICDO-3 code, NCIt code and property name <br> return data that partially matches melanoma. | [search?keyword=melanoma&options=partial](' + protocol + '://' + host + basePath + '/search?keyword=melanoma&options=partial)|\n' +
              '| - perform exact search in enums, ICDO-3 code, NCIt code and property name <br> return data that exactly matches melanoma.  | [search?keyword=melanoma&options=exact](' + protocol + '://' + host + basePath + '/search?keyword=melanoma&options=exact)|\n' +
              '| - perform exact search in enums, ICDO-3 code, NCIt code, property name and Synonyms <br> return data that exactly matches melanoma. | [search?keyword=melanoma&options=exact,syn](' + protocol + '://' + host + basePath + '/search?keyword=melanoma&options=exact,syn)|\n' +
              '| - perform partial search in enums, ICDO-3 code, NCIt code, property name and Synonyms and property description <br> return data that partially matches melanoma in property description. | [search?keyword=melanoma&options=syn,desc](' + protocol + '://' + host + basePath + '/search?keyword=melanoma&options=syn,desc)|\n' +
              '| | |\n' +
              '| **keyword & options & sources**  | |\n' +
              '| - perform partial search in enums, ICDO-3 code, NCIt code and property name <br> return data that partially matches melanoma from **gdc** data. | [search?keyword=melanoma&options=partial&sources=gdc](' + protocol + '://' + host + basePath + '/search?keyword=melanoma&options=partial&sources=gdc)|\n' +
              '| - perform exact search in enums, ICDO-3 code, NCIt code and property name <br> return data that exactly matches melanoma from **gdc** and **icdc** data.  | [search?keyword=melanoma&options=exact&sources=gdc,icdc](' + protocol + '://' + host + basePath + '/search?keyword=melanoma&options=exact&sources=gdc,icdc)|\n' +
              '| | |\n' +
              '| with **format** | |\n' +
              '| - perform partial search in enums, ICDO-3 code, NCIt code and property name <br> return data that partially matches melanoma in **json** format. | [search?keyword=melanoma&options=partial&format=json](' + protocol + '://' + host + basePath + '/search?keyword=melanoma&options=partial&format=json)|\n' +
              '| - perform exact search in enums, ICDO-3 code, NCIt code and property name <br> return data that exactly matches melanoma in **xml** format.  | [search?keyword=melanoma&options=exact&format=xml](' + protocol + '://' + host + basePath + '/search?keyword=melanoma&options=exact&format=xml)|\n',
            'parameters': [
              {
                'name': 'keyword',
                'in': 'query',
                'required': true,
                'description': 'The term/phrase to be searched',
                'type': 'string'
              }, {
                'name': 'options',
                'in': 'query',
                description: 'The options specifications are: partial or exact, syn, desc.',
                'type': 'string'
              }, {
                'name': 'sources',
                'in': 'query',
                'description': 'The sources specifications are: ctdc, gdc, icdc or pcdc.',
                'type': 'string'
              }, {
                'name': 'format',
                'in': 'query',
                'description': 'The format specifications are: json and xml.',
                'type': 'string',
                'enum': ['json','xml',],
                'value':'json'
              }

            ],
            'responses': {
              '200': {
                'description': 'Success',
                'schema': {
                  '$ref': '#/definitions/results'
                }
              },
              '404': {
                'description': 'The resource you were trying to reach is not found'
              }
            }
          }
        },
        '/source/{source}': {
            'get': {
              'tags': ['Retrieve Dataset'],
              'summary': 'Restful APIs Description Summary',
              'description': ' Query Patterns is: ' + protocol + '://' + host + basePath + '**/source/{ctdc,gdc,icdc,pcdc}?format={json,xml}**. \n'+ 
                'One **endpoint(path)** is required from (**ctdc,gdc,icdc,pcdc**) datasets.\n' +
                '# Format\n' +
                'The **format** parameter is specify the result data format. \n' +
                'The **json** format is the default one and could be omitted. Valid entries for data format are: **json** or **xml**. \n' +
                '| Example | URL |\n' +
                '|---|---|\n' +
                '| will perform partial search in enums, ICDO-3 code, NCIt code and property name and return data that partially matches melanoma. | [source/icdc](' + protocol + '://' + host + basePath + '/source/icdc)|\n' +
                '| will perform exact search in enums, ICDO-3 code, NCIt code and property name and return data that exactly matches melanoma.  | [source/icdc?format=json](' + protocol + '://' + host + basePath + '/source/icdc?format=json)|\n',
                'parameters': [
                {
                  'name': 'source',
                  'in': 'path',
                  'required': true,
                  'description': 'The term/phrase to be searched',
                  'type': 'string',
                  'enum': ['ctdc','gdc','icdc','pcdc'],
                  'value':'icdc'
                }
              ],
              'responses': {
                '200': {
                  'description': 'Success',
                  'schema': {
                    '$ref': '#/definitions/results'
                  }
                },
                '404': {
                  'description': 'The resource you were trying to reach is not found'
                }
              }
            }
          }
      },
      'definitions': {
        'results': {
          'type': 'array',
          'items': {
            'properties': {
              '_source': {
                '$ref': '#/definitions/_source'
              },
              'matches': {
                '$ref': '#/definitions/matches'
              }
            }
          }
        },
        '_source': {
          'properties': {
            'property': {
              'type': 'string'
            },
            'node': {
              'type': 'string'
            },
            'nodeDescription': {
              'type': 'string'
            },
            'category': {
              'type': 'string'
            },
            'propertyDescription': {
              'type': 'string'
            },
            'type': {
              'type': 'string'
            },
            'cde': {
              '$ref': '#/definitions/cde'
            }
          }
        },
        'cde': {
          'properties': {
            'id': {
              'type': 'string'
            },
            'url': {
              'type': 'string'
            }
          }
        },
        'matches': {
          'type': 'array',
          'items': {
            'properties': {
              'value': {
                'type': 'string'
              },
              'icdo3Code': {
                'type': 'string'
              },
              'allSynonyms': {
                '$ref': '#/definitions/allSynonyms'
              },
              'icdo3Strings': {
                '$ref': '#/definitions/icdo3Strings'
              }
            }
          }
        },
        'allSynonyms': {
          'type': 'array',
          'items': {
            'properties': {
              'conceptCode': {
                'type': 'string'
              },
              'synonyms': {
                '$ref': '#/definitions/synonyms'
              }
            }
          }
        },
        'synonyms': {
          'type': 'array',
          'items': {
            'properties': {
              'termName': {
                'type': 'string'
              },
              'termGroup': {
                'type': 'string'
              },
              'termSource': {
                'type': 'string'
              }
            }
          }
        },
        'icdo3Strings': {
          'type': 'array',
          'items': {
            'properties': {
              'value': {
                'type': 'string'
              },
              'termGroup': {
                'type': 'string'
              }
            }
          }
        }
      }
    };
  }
