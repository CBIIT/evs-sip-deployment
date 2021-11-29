module.exports = function (protocol, host, basePath) {
    return {
      'swagger': '2.0',
      'info': {
        'version': '1.0.0',
        'title': 'EVSSIP Restful API',
        'description': 'EVSSIP Restful API.'
      },
      'host': host,
      'basePath': basePath,
      'tags': [
        {
          'name': 'Search',
          'description': 'Rest APIs provide flexibilities for searching data using hierarchical patterns.'
        },
        {
            'name': 'Retrieve Model Data',
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
            'description': ' Query Patterns is: ' + protocol + '://' + host + basePath + '**/search?keyword={keywords}&model={ctdc,gdc,icdc,pcdc}&type={node,prop,value}**. \n'+ 
              '# Keyword\n' +
              'The **keyword** parameter is required to specify the term or phrase to be searched.\n' +
              '# Model\n' +
              'The **model** parameter is specify one or more data model to perform a custom search.\n' +
              'Valid entries for options specifications are: **ctdc** or **gdc**, **icdc**, **pcddc**. \n' +
              '\n' +
              '# Type\n' +
              'The **type** parameter is used to perform a custom search at specified entity level.\n' +
              'Valid entries for options specifications are: **node** or **prop**, **value**. \n' +
              '\n' +
              'The **node** is **default** search option, It is not necessary to specify it \n' +
              'The **prop** is used to perform search properties for term or phrase specified in keyword. \n' +
              'The **value** is used to perform search terms values for term or phrase specified in keyword. \n' +
              '\n' +
              '| Example | URL |\n' +
              '|---|---|\n' +
              '| **keyword** only | |\n' +
              '| - perform partial search in node name <br> return data that partially matches **diagnosis**. | [search?keyword=diagnosis](' + protocol + '://' + host + basePath + '/search?keyword=diagnosis)|\n' +
              '| | |\n' +
              '| **keyword & model** | |\n' +
              '| - perform partial search in enums, ICDO-3 code, NCIt code and property name <br> return data that partially matches diagnosis. | [search?keyword=diagnosis&model=icdc](' + protocol + '://' + host + basePath + '/search?keyword=diagnosis&model=icdc)|\n' +
              '| | |\n' +
              '| **keyword & options & sources**  | |\n' +
              '| - perform partial search in enums, ICDO-3 code, NCIt code and property name <br> return data that partially matches diagnosis from **ctdc** data. | [search?keyword=diagnosis&model=icdc&type=prop](' + protocol + '://' + host + basePath + '/search?keyword=diagnosis&model=icdc&type=prop)|\n',
            'parameters': [
              {
                'name': 'keyword',
                'in': 'query',
                'required': true,
                'description': 'The term/phrase to be searched',
                'type': 'string'
              }, {
                'name': 'model',
                'in': 'query',
                'description': 'The sources specifications are: GDC, CTDC, ICDC or PCDC.',
                'type': 'string',
                'default': 'ICDC'
              }, {
                'name': 'type',
                'in': 'query',
                'description': 'The options specifications are: node or prop, value.',
                'type': 'string',
                'default': 'node'
              }
            ],
            'responses': {
              '200': {
                'description': 'Success',
                'schema': {
                  '$ref': '#/definitions/Result'
                }
              },
              '400': {
                'description': 'Not valid data model.'
              },
              '404': {
                'description': 'Data not found'
              }
            }
          }
        },
        '/source/{model}': {
            'get': {
              'tags': ['Retrieve Model Data'],
              'summary': 'Restful APIs Description Summary',
              'description': ' Query Patterns is: ' + protocol + '://' + host + basePath + '**/source/{ctdc,gdc,icdc,pcdc}?format={json,xml}**. \n'+ 
                'One **endpoint(path)** is required from (**ctdc,gdc,icdc,pcdc**) datasets.\n' +
                '# Format\n' +
                'The **format** parameter is specify the result data format. \n' +
                'The **json** format is the default one and could be omitted. Valid entries for data format are: **json** or **xml**. \n' +
                '| Example | URL |\n' +
                '|---|---|\n' +
                '| will perform partial search in enums, ICDO-3 code, NCIt code and property name and return data that partially matches diagnosis. | [source/icdc](' + protocol + '://' + host + basePath + '/source/icdc)|\n' +
                '| will perform exact search in enums, ICDO-3 code, NCIt code and property name and return data that exactly matches diagnosis.  | [source/icdc?format=json](' + protocol + '://' + host + basePath + '/source/icdc?format=json)|\n',
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
                    '$ref': '#/definitions/Node'
                  }
                },
                '400': {
                  'description': 'Not valid data model.'
                },
                '404': {
                  'description': 'Data not found'
                }
              }
            }
          }
      },
      'definitions': {
        'Result': {
          'type': 'object',
          'properties': {
            'type': {
              'type': 'string',
              'description': 'data entity type',
              'enum': [
                'node',
                'props',
                'node'
              ]},
            'result': {
              '$ref': '#/definitions/Node'
            }
          },
          'xml': {
            'name': 'Results'
          }
        },
        'Node': {
          'type': 'object',
          'properties': {
            'model': {
              'type': 'string',
              'description': 'data model',
              'enum': [
                'GDC',
                'CTDC',
                'ICDC',
                'PCDC'
              ]
            },
            'node_name': {
              'type': 'string'
            },
            'properties': {
              'type': 'array',
              'items':{
                '$ref': '#/definitions/Property'
              }
            }
          },
          'xml': {
            'name': 'Node'
          }
        },
        'Property': {
          'type': 'object',
          'properties': {
            'property_Name': {
              'type': 'string'
            },
            'value_Type': {
              'type': 'string'
            },
            'values': {
              'type': 'array',
              'items':{
                '$ref': '#/definitions/Term'
              }
            }
          },
          'xml': {
            'name': 'Property'
          }
        },
        'Term': {
          'type': 'object',
          'properties': {
            'values': {
              'type': 'string'
            }
          },
          'xml': {
            'name': 'Value'
          }
        }
      }
    };
  }
